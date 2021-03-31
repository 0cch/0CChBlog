---
author: admin
comments: true
layout: post
slug: 'Pointer to implementation'
title: 指向实现的指针Pointer to implementation
date: 2021-08-05 21:25:52
categories:
- CPP
---

写这篇文章缘于我的一个朋友的故事：

> 插件业务部门线上发布插件，发布之后经过用户反馈得知用户那更新插件后出现程序崩溃。检查原因是某个基础模块用导出类的方式导出接口，但是基础部门最近改动了基础模块某个类的内存布局，即头文件中类的定义发生了变化。

导出类作为接口是一个比较考验编程经验的事情，随意的导出类很容易导致二进制兼容性问题。对于有经验的程序员一般会想到2中可行方案：

1. 定义纯虚类，实现派生类并且将所有的细节全部隐藏在派生类中，然后通过工厂类输出基类指针。典型的应用场景如Windows导出的COM接口。
2. 使用指向实现的指针（pimpl），即这篇文章的主题。典型的应用场景如Qt。

当然，使用pimpl优点并不限于上面提到的这一种，总体说来包括：

1. 解决二进制兼容性问题；
2. 减少头文件依赖，给项目编译提速；
3. 提供的接口文件中可以隐藏实现细节；
4. 对于移动语义非常友好。

pimpl也是有缺点的，比如：

1. 需要从额外从堆中分配内存；
2. `const`声明会被忽略；

当然这些问题都是通过一些列方法改善的。但是说到底，实现pimpl有一些细节需要特殊小心。好了，现在让我们从头开始介绍pimpl。

## 需要隐藏的实现细节

 从C语言开始头文件（.h）就一直作为接口文件提供给用户，那个时候的头文件可以很轻松的隐藏实现细节，因为它们只需要对外暴露函数即可：

``` c
void* malloc (size_t size);
void free (void* ptr);
```

但是到了C++，头文件就很难隐藏实现细节了，因为需要将数据成员定义在类中，导致细节暴露：

``` c++
// someclass.h
class SomeClass {
public:
	int foo();
private:
	int m_someData = 0;
};

// someclass.cpp
#include <someclass.h>
int SomeClass::foo()
{
	return m_someData;
}
```

上面的代码暴露了类的数据成员。另外一个问题是，如果`SomeClass`引用了其他对象，那么可能需要`include`更多头文件，这样做的代价是降低了编译效率：

```c++
// someclass.h
#include <A>
#include <B>
#include <C>
class SomeClass {
public:
	int foo();
private:
	int m_someData = 0;
    AClass m_aClass;
    BClass m_bClass;
    CClass m_cClass;
};
```

因为C++的预处理器是直接用替换的方式将头文件`A`、`B`和`C`加到`someclass.h`中的。另外，无论这些头文件中哪个发生变动，都会导致任何引用`someclass.h`的源文件重新编译，非常的低效。当然，有一种解决方案是前置声明类：

``` c++
// someclass.h
class AClass;
class BClass;
class CClass;

class SomeClass {
public:
	int foo();
private:
	int m_someData = 0;
    AClass *m_aClass;
    BClass *m_bClass;
    CClass *m_cClass;
};
```

这样确实可以解决以上编译相关的问题，但是引入的新问题是它需要多次访问堆来分配内存，对于代码的运行效率是不利的。此外，它也没法解决暴露细节的问题。所以我们需要pimpl来帮助我们解决上述这些问题。

## pimpl的简单实现

``` c++
// someclass.h
class SomeClassPrivate;
class SomeClass {
public:
	SomeClass();
	~SomeClass();
	int foo();
private:
	SomeClassPrivate *m_pimpl = nullptr;
};

// someclass.cpp
#include <someclass.h>
#include <A>
#include <B>
#include <C>

class SomeClassPrivate {
public:
	int foo() { return m_someData; };
private:
	int m_someData = 0;
    AClass m_aClass;
    BClass m_bClass;
    CClass m_cClass;
};

SomeClass::SomeClass() : m_pimpl(new SomeClassPrivate) {}

SomeClass::~SomeClass() { delete m_pimpl; }

int SomeClass::foo()
{
	return m_pimpl->foo();
}
```

上面的代码将之前头文件中的所有细节隐藏到`SomeClassPrivate`之中，用户对于`SomeClassPrivate`可以是一无所知的，无论怎么修改`SomeClassPrivate`的内存布局，都不会影响用户对`SomeClass`的使用，也不会存在兼容性问题。另外由于没有引入额外头文件，不会发生宏展开，对`A`、`B`和`C`头文件的修改只会让`someclass.cpp`重新编译，并不会影响其他引用`someclass.h`的源文件。又因为`m_aClass`、`m_bClass`和`m_cClass`会一次性随着`SomeClassPrivate`从堆中分配，这样就减少了两次堆访问，提高的运行效率。最后，这样的结构对移动语义非常友好：

``` c++
// someclass.h
class SomeClass {
public:
    ...
	SomeClass(SomeClass&& other);
	SomeClass& SomeClass::operator=(SomeClass&& other);
private:
	SomeClassPrivate *m_pimpl = nullptr;
};

// someclass.cpp
SomeClass::SomeClass(SomeClass&& other) : m_pimpl(other.m_pimpl) { 
    other.m_pimpl = nullptr; 
}
SomeClass& SomeClass::operator=(SomeClass&& other) {
	std::swap(m_pimpl, other.m_pimpl);
	return *this;
}
```

## 解决pimpl存在的问题

上文我们提到过pimpl存在的2个问题，现在让我们看看它们是什么，并且如何解决这2个问题。

### 额外从堆中分配内存

这个问题其实容易解决，为了提高效率我们可以采用内存池来管理内存分配。

``` c++
SomeClass::SomeClass() : m_pimpl(
	new(somePool::malloc(sizeof(SomeClassPrivate))) SomeClassPrivate) {}
SomeClass::~SomeClass() {
	m_pimpl->~SomeClassPrivate();
	somePool::free(m_pimpl);
}
```

### `const`声明被忽略

这是一个比较有趣的问题，让我们看看以下代码：

``` c++
int SomeClass::foo() const
{
	return m_pimpl->foo();
}
```

虽然这里`foo()`函数被声明为`const`，说明函数中`this`的类型是`const SomeClass*`，但是这只能表示`m_pimpl`是一个`SomeClass * const`，也就是说`m_pimpl`是一个指针常量，而不是一个指向常量的指针。这导致`const`对`m_pimpl->foo()`没有任何约束能力。

为了解决这个问题，我们可以想到两种方法。

首先可以仿造Qt的代码实现两个代理函数：

``` c++
const SomeClassPrivate * SomeClass::d_func() const { return m_pimpl; }
SomeClassPrivate * SomeClass::d_func() { return m_pimpl; }
```

通过这种方式获取对象指针能传递将函数的`const`：

``` c++
class SomeClassPrivate {
public:
	int foo() const { return m_someData; };
private:
	int m_someData = 0;
};

int SomeClass::foo() const
{
	return d_func()->foo();
}
```

在Qt中有一个宏来实现这个方法：

``` c++
#define Q_DECLARE_PRIVATE(Class) \
    inline Class##Private* d_func() \
    { Q_CAST_IGNORE_ALIGN(return reinterpret_cast<Class##Private *>(qGetPtrHelper(d_ptr));) } \
    inline const Class##Private* d_func() const \
    { Q_CAST_IGNORE_ALIGN(return reinterpret_cast<const Class##Private *>(qGetPtrHelper(d_ptr));) } \
    friend class Class##Private;
```

另外一个方法是使用`std::experimental::propagate_const`，不过该方法还在C ++库基础技术规范第二版（ C++ *Library Fundamentals* Technical Specification V2）中，还没有正式加入STL。不过原理非常简单：

``` c++
template <typename T>
class propagate_const {
public:
    explicit propagate_const( T * t ) : p( t ) {}
    const T & operator*() const { return *p; }
    T & operator*() { return *p; }
    
    const T * operator->() const { return p; }
    T * operator->() { return p; }
private:
    T * p;
};

class SomeClass {
public:
    ...
private:
	propagate_const<SomeClassPrivate> m_pimpl
};

```

这种方式比`d_func`要繁琐一些，但有一个好处是程序员无法直接使用原生的`SomeClassPrivate*`，而`d_func`却没法控制，必须依靠代码规范约束每个程序员。

## 一个使用pimpl值得注意的问题

当使用pimpl的时候如果有`SomeClassPrivate`中调用`SomeClass`成员函数的需求，需要将`SomeClass`的`this`指针传入`SomeClassPrivate`。这很简单啊！

``` c++
// someclass.cpp
#include <someclass.h>
class SomeClassPrivate {
public:
	SomeClassPrivate(SomeClass* p) : m_pub(p) {}
	int foo() { return m_someData; };
	void baz() { m_pub->bar(); }
private:
	int m_someData = 0;
	SomeClass* m_pub = nullptr;
};

SomeClass::SomeClass() : m_pimpl(new SomeClassPrivate(this)) {}

SomeClass::~SomeClass() { delete m_pimpl; }

int SomeClass::foo()
{
	return m_pimpl->foo();
}

int SomeClass::bar()
{
	return 0;
}
```

错！请记住，当`SomeClass`正在构造的时候，传递`this`指针是非常不安全的，可能造成未定义的行为。正确的做法是在初始化列表完成以后再给`m_pub`赋值。

``` c++
// someclass.cpp
#include <someclass.h>
class SomeClassPrivate {
public:
	SomeClassPrivate() {}
	int foo() { return m_someData; };
	void baz() { m_pub->bar(); }
	void init(SomeClass* p) { m_pub = p; }
private:
	int m_someData = 0;
	SomeClass* m_pub = nullptr;
};

SomeClass::SomeClass() : m_pimpl(new SomeClassPrivate) {
	m_pimpl->init(this);
}

SomeClass::~SomeClass() { delete m_pimpl; }

int SomeClass::foo()
{
	return m_pimpl->foo();
}

int SomeClass::bar()
{
	return 0;
}
```

和`m_pimpl`一样，`m_pub`也应该用`propagate_const`来包装。当然也可以实现类似`d_func`的函数。比如Qt就是通过定义一组`q_func`来实现的：

``` c++
#define Q_DECLARE_PUBLIC(Class)                                    \
    inline Class* q_func() { return static_cast<Class *>(q_ptr); } \
    inline const Class* q_func() const { return static_cast<const Class *>(q_ptr); } \
    friend class Class;
```

好了，关于pimpl的内容我要写的就这么多了，如果pimpl还有其他有趣的技巧欢迎发邮件与我交流。最后说一句：“基础部门赶紧把二进制兼容问题解决掉呀！”