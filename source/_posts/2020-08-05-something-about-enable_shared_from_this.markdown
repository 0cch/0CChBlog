---
author: admin
comments: true
layout: post
slug: 'something about enable_shared_from_this'
title: std::enable_shared_from_this原理浅析
date: 2020-08-05 17:54:11
categories:
- CPP
---

在解释`std::enable_shared_from_this`之前，先看一个`std::shared_ptr`典型用法：

``` c++
#include <memory>

int main()
{
	std::shared_ptr<int> pt1{ new int{ 10 } };
	auto pt2{ pt1 };
}
```

这时`pt1`和`pt2`共用了引用计数，当`pt1`和`pt2`的生命周期都结束时，`new int{10}`分配的内存会被释放。下面的做法会导致内存多次释放，因为它们没有使用共同的引用计数：

``` c++
#include <memory>

int main()
{
    auto pt{ new int{ 10 } };
	std::shared_ptr<int> pt1{ pt };
	std::shared_ptr<int> pt2{ pt };
}
```

当然，我想应该也没有人这么使用`std::shared_ptr`。不过下面这个错误倒是比较常见：

``` c++
struct SomeData;
void SomeAPI(const std::shared_ptr<SomeData>& d) {}

struct SomeData {
	void NeedCallSomeAPI() {
		// 需要用this调用SomeAPI
	}
};
```

上面这段代码需要在`NeedCallSomeAPI`函数中调用`SomeAPI`，而`SomeAPI`需要的是一个`std::shared_ptr<SomeData>`的实参。这个时候应该怎么做？

``` c++
struct SomeData {
	void NeedCallSomeAPI() {
		SomeAPI(std::shared_ptr<SomeData>{this});
	}
};
```

上面的做法是错误的，因为`SomeAPI`调用结束后`std::shared_ptr<SomeData>`对象的引用计数会降为0，导致`this`被意外释放。

这种情况下，我们需要使用`std::enable_shared_from_this `，使用方法很简单，只需要让`SomeData`继承`std::enable_shared_from_this<SomeData>`，然后调用`shared_from_this`吗，例如：

``` c++
#include <memory>

struct SomeData;
void SomeAPI(const std::shared_ptr<SomeData>& d) {}

struct SomeData:std::enable_shared_from_this<SomeData> {
	static std::shared_ptr<SomeData> Create() {
		return std::shared_ptr<SomeData>(new SomeData);
	}
	void NeedCallSomeAPI() {
		SomeAPI(shared_from_this());
	}
private:
	SomeData() {}
};


int main()
{
	auto d{ SomeData::Create() };
	d->NeedCallSomeAPI();
}
```

`std::enable_shared_from_this `的实现比较复杂，但是实现原理则比较简单。它内部使用了`std::weak_ptr`来帮助完成指针相关控制数据的同步，而这份数据是在创建`std::shared_ptr`的时候完成的。我们来重点解析这一点。

``` c++
template<class T>
class enable_shared_from_this {
 mutable weak_ptr<T> weak_this;
public:
 shared_ptr<T> shared_from_this() {
  return shared_ptr<T>(weak_this); 
 }
 shared_ptr<const T> shared_from_this() const {
  return shared_ptr<const T>(weak_this); 
 }
...
 template <class U> friend class shared_ptr;
};
```

以上是摘要的`enable_shared_from_this`的代码，这份代码中有两个关键要素。首先`weak_this`被声明为`mutable`，这让`weak_this`可以在`const`的限定下修改，其次也是最关键的地方，该类声明了`shared_ptr`为友元。这意味着`std::shared_ptr`可以修改`weak_this`，并且`weak_this`被初始化的地方在`std::shared_ptr`中。进一步说，没有`std::shared_ptr`的`enable_shared_from_this`是没有灵魂的：

``` c++
#include <memory>

struct SomeData;
void SomeAPI(const std::shared_ptr<SomeData>& d) {}

struct SomeData:std::enable_shared_from_this<SomeData> {
	void NeedCallSomeAPI() {
		SomeAPI(shared_from_this());
	}

};


int main()
{
	auto d{ new SomeData };
	d->NeedCallSomeAPI();
}
```

在这份代码中调用`shared_from_this`会出错。

再深入一步，`std::shared_ptr`是如何判断实例化对象类型是否继承`std::enable_shared_from_this`，并且通过判断结果决定是否初始化`weak_this`的呢？答案是SFINAE("*Substitution Failure Is Not An Error*")。

让我们查看VS2019的STL代码：

``` c++
template <class _Ty>
class enable_shared_from_this { 
public:
    using _Esft_type = enable_shared_from_this;
    ...
}

template <class _Yty, class = void>
struct _Can_enable_shared : false_type {};

template <class _Yty>
struct _Can_enable_shared<_Yty, void_t<typename _Yty::_Esft_type>>
    : is_convertible<remove_cv_t<_Yty>*, typename _Yty::_Esft_type*>::type {
};
```

这里的重点是`_Can_enable_shared`，如果目标类型有内嵌类型`_Esft_type`，并且目标类型和内嵌类型的指针是可转换的，也就是有继承关系，那么类型结果为`true_type`，反之为`false_type`。

``` c++
 template <class _Ux>
    void _Set_ptr_rep_and_enable_shared(_Ux* const _Px, _Ref_count_base* const _Rx) noexcept {
        this->_Ptr = _Px;
        this->_Rep = _Rx;
        if constexpr (conjunction_v<negation<is_array<_Ty>>, negation<is_volatile<_Ux>>, _Can_enable_shared<_Ux>>) {
            if (_Px && _Px->_Wptr.expired()) {
                _Px->_Wptr = shared_ptr<remove_cv_t<_Ux>>(*this, const_cast<remove_cv_t<_Ux>*>(_Px));
            }
        }
    }
```

接下来，如果对象不是数组、不是`volatile`声明的并且`_Can_enable_shared`返回`true_type`，那么`_Wptr`才会被初始化。`std::shared_ptr`的构造函数以及`std::make_shared`函数都会调用该函数。

以上就是`std::enable_shared_from_this`实现原理中比较关键的一个部分。