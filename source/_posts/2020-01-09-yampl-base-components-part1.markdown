---
author: admin
comments: true
layout: post
slug: 'yampl base components part1'
title: YAMPL的基础组件(1)
date: 2020-01-09 12:15:47
categories:
- CPP
---

从本篇开始，我们将开始进入轻量级C++模板元编程库YAMPL(Yet Another MPL)的编写环节。不过，在深入探索元编程的序列和算法之前，有一些基础工作必须完成，比如定义命名空间、定义整型常量包装类模板，编写包装类的算数和逻辑运算元函数、编写用于调试的类型打印元函数等等。在完成了这些基础组件后，序列和算法的编写工作将会变得非常高效和有趣。

## 定义命名空间

在前面的文章中，我们定义了两个特殊的类型`true_type`和`false_type`。不巧的是，在STL中也有两个一模一样的类型名，而且这两个类型在STL的type_traits中被广泛的使用，例如：`std::is_same`、`std::is_class`、`std::is_const`等等，它们的返回类型就是上述两种类型的其中之一。无独有偶，在Boost中也有这样的两个类型。其实，有一点很容易想到，作为Boost.MPL的模仿者，YAMPL中一定会存在大量与Boost.MPL中相同的命名。所以为了解决以上这类问题，必须为YAMPL安排一个命名空间。为了直观，我就直接定义YAMPL的命名空间名为`yampl`。

那么现在对于`true_type`这样的类型有三种实现，包括：`yampl::true_type`、`stl::true_type`以及`boost::true_type`。面对这样的情况，我们有时候会需要一个类型的转换元函数，例如：

``` c++
template <class T, class U, class V>
struct type_convert_to;

template <class T, class V>
struct type_convert_to<T, T, V> {
	using type = V;
};

template <class T>
using stl_to_yampl_true_type = type_convert_to<T, std::true_type, yampl::true_type>;
```

在上面的代码中，元函数`stl_to_yampl_true_type`可以将`std::true_type`转换为`yampl::true_type`，如果该元函数的实参不是`std::true_type`则编译出错。如果有需要在库与库之间频繁切换的情况，实现一个这样的转换元函数是很有用的一种方法。

有一点需要指出的是，在后面的文章中会涉及到一些对YAMPL中元函数调用的示例，这些示例一般都默认认为已经使用`using namespace yampl;`打开过`yampl`的命名空间，所以没有使用前缀写法`yampl::xxx`。只有涉及到不同命名空间类型互相转换的情况才会用前缀的方式指明命名空间。

## 整型常量包装类模板

在YAMPL中的元函数都是关于类型的计算，但有时候数值计算却又是不可避免的。为了让类型计算的元函数能兼容数值计算，我们需要一个特殊的类模板，它能够将数值转换为类型。这里我们称这个特殊的类模板为整型常量包装类模板。其实在上一篇中我们已经见到过它的简化版本，以下是它的完整版：

``` c++
template <class T, T N>
struct integral_const {
  using value_type = T;
  using type = integral_const;
  static constexpr value_type value = N;
  using next = integral_const<T, N + 1>;
  using prior = integral_const<T, N - 1>;
};
```

在上面的代码中，`integral_const`是整型常量包装类模板，其模板形参`T`是包装常量的类型，形参`N`是包装的具体数值，例如：`integral_const<int, 5>`是一个包装了数值为1的`int`类型常量的类型。`integral_const`定义了静态数据成员`value`来返回包装类型代表的具体数值，定义`value_type`来指示返回数值的准确类型。另外为了元函数调用形式上的统一，`integral_const`还定义内嵌类型`type`为自身。最后我们还可以发现，`integral_const`为了方便完成数值的自增和自减操作，分别定义了`next`和`prior`来表示`integral_const<T, N + 1>`和`integral_const<T, N - 1>`，于是我们可以完成这样的操作：

``` c++
std::is_same_v<integral_const<int, 5>::next, integral_const<int, 6>>;
```

`std::is_same_v`返回的结果为`true`。

到目前为止`integral_const`似乎已经满足要求了，这很好，但还有一点却令人厌烦。考虑一下如果我们需要在序列中声明一连串的`integral_const`会发生什么？

``` c++
seq<integral_const<int, 1>, integral_const<int, 2>, integral_const<int, 3>, ...>
```

显然这种写法过于冗长，这里需要一种更简洁的表达方法，我选择使用别名模板：

``` c++
template <int N>
using int_ = integral_const<int, N>;
```

这样一来定义上面的序列会简洁不少：

``` c++
seq<int_<1>, int_<2>, int_<3>, ...>
```

另外，读者还可以定义其他别名模板以满足自己的需求，比如定义一个无符号整型常量的包装类模板：

``` c++
template <unsigned int N>
using uint_ = integral_const<unsigned int, N>;
```

值得注意的是，布尔类型也可以使用`integral_const`来表示，因为它能和整型发生隐式转换，但会有一些不同之处，请看下面这个针对`bool`的特化版本：

``` c++
template <bool N>
struct integral_const<bool, N> {
  using value_type = bool;
  using type = integral_const;
  static constexpr value_type value = N;
};

template <bool N>
using bool_ = integral_const<bool, N>;

using true_type = bool_<true>;
using false_type = bool_<false>;
```

观察上面的代码可以发现，特化版本的`integral_const`删除了`next`和`prior`，这是因为布尔类型只有`true`和`false`之分，自增和自减对于它是没有意义的。另外还定义了`true_type`和`false_type`以方便后续使用，它们在YAMPL中使用的是比较频繁的。

## if元函数

`if`元函数是YAMPL中最常用的元函数之一，又因为它不依赖其他元函数，所以应该优先介绍它。不过实际上，我们在上一篇已经对`if`元函数做过了比较详细的介绍了，为了本篇知识体系的完整性这里将它拿出来总结一下：

``` c++
template <bool B, class N1, class N2>
struct if_c {
  using type = N1;
};

template <class N1, class N2>
struct if_c<false, N1, N2> {
  using type = N2;
};

template <class T, class N1, class N2>
struct if_ {
  using type = typename if_c<!!T::value, N1, N2>::type;
};
```

上面的代码有两个元函数`if`和`if_c`，其中`if_c`是真正实现选择逻辑的元函数，它接受的条件参数是布尔值。而元函数`if`对`if_c`进行了一次包装，这使得它接受的条件参数从一个布尔值转换为了类型，而且这种类型还有相当不错的兼容性，它只要求类型具有静态数据成员`value`即可，所以上一节提到的`true_type`、`false_type`、`int_<7>`甚至其他库的`std::true_type`、`boost::mpl::false_`等等都可以兼容`if`元函数。