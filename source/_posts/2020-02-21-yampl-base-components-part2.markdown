---
author: admin
comments: true
layout: post
slug: 'yampl base components part2'
title: YAMPL的基础组件(2)
date: 2020-02-21 20:48:33
categories:
- CPP
---

## 整型转换等级

考虑一个简单的问题，在C++中将两个不同类型的整型操作数相加的结果会是怎么样的？比如用`short`类型的变量和`long`类型的变量相加。答案很简单，相加的结果应该是一个`long`类型，因为`short`类型隐式转换为`long`，于是就需要我们使用一个`long`类型的变量来存储计算结果。在C++11以后，我们可以通过类型说明符`auto`把这件事情交给编译器来完成。但是在模板元编程中，这件事是需要我们亲力亲为的。因此需要一个有效的工具来选择合适的类型，那就是类型转换等级。所谓转换等级实际上是类型根据C++隐式类型转换规则的一种排序，简单来说整型转换等级的排序符合下面两条规则：

1. 若两操作数的类型所需的存储空间大小不同，则存储空间较小的操作数类型隐式转换到存储空间较大的操作数类型。
2. 若两操作数的类型所需的存储空间大小相同但符号性不同，则有符号类型操作数会隐式转换成无符号类型。

下面是YAMPL对整型转换等级的排序：

``` c++
template <typename T>
struct integral_rank;

template <> struct integral_rank<bool> : int_<1> {};
template <> struct integral_rank<signed char> : int_<2> {};
template <> struct integral_rank<char> : int_<3> {};
template <> struct integral_rank<unsigned char> : int_<4> {};
template <> struct integral_rank<wchar_t> : int_<5> {};
template <> struct integral_rank<char16_t> : int_<6> {};
template <> struct integral_rank<short> : int_<7> {};
template <> struct integral_rank<unsigned short> : int_<8> {};
template <> struct integral_rank<char32_t> : int_<9> {};
template <> struct integral_rank<int> : int_<10> {};
template <> struct integral_rank<unsigned int> : int_<11> {};
template <> struct integral_rank<long> : int_<12> {};
template <> struct integral_rank<unsigned long> : int_<13> {};
template <> struct integral_rank<long long> : int_<14> {};
template <> struct integral_rank<unsigned long long> : int_<15> {};
```

`integral_rank`是一个用于描述整型转换等级的类模板，它的实现非常简单，只是继承了类模板`int_`的实例，如此一来我们可以通过`::value`的方法访问类型等级的值，这个技巧在C++模板元编程中被称为元函数转发。

整体的来看这段代码，可以看出等级的排序顺序由小到大，在规则上转换也总是从小到大进行的。比如，`char`类型的等级为3，`int`类型的等级为10，于是这两个类型的操作数互相作用后的结果是一个等级数值更大的`int`类型。为了方便的选择转换等级，YAMPL还提供了一个元函数来完成这件事，该函数依赖元函数`if_c`：

``` c++
template <class T1, class T2>
using largest_int =
    if_c<integral_rank<T1>::value >= integral_rank<T2>::value, T1, T2>;
```

或者

``` c++
template <class T1, class T2>
struct largest_int
    : if_c<integral_rank<T1>::value >= integral_rank<T2>::value, T1,
                       T2> {};
```

这里无论是使用别名模板还是元函数转发都会调用元函数`if_c`比较对应类型的转换等级，最终给出拥有较大等级的类型。它们的结果是相同的，读者可以根据自己的喜好来选择`largest_int`的实现方案。

在下面这段代码中`largest_int`和`auto`具有相同的效果，`val1`和`val2`都会被编译器推导为`int`类型。

``` c++
int a1 = 5;
char a2 = 7;
largest_int<int, char>::type val1 = a1 + a2;
auto val2 = a1 + a2;
```

## 算术运算符元函数

我们知道在YAMPL中，整型常量都被包装类模板包装成了特殊的类型。这种处理方式为类型序列和元函数提供了操作数值途径，但随之而来的后果是无法对包装类进行加减乘除等算术运算，同样的也无法对包装类进行逻辑运算。为了解决这类计算问题，我们需要为YAMPL提供一套打通数值计算和类型计算的元函数，让它们来完成算术和逻辑的运算工作。

事实上，上一篇中的`plus`元函数就可以被列出其中，不过我并不打算直接这么做，因为它还有进一步完善的空间，请看下面的代码：

``` c++
template <class N1, class N2, class... Nargs>
struct plus {
  using inner = plus<N2, Nargs...>;
  using value_type = typename largest_int<typename N1::value_type,
                                          typename inner::value_type>::type;
  using type = integral_const<value_type, N1::value + inner::value>;
  static constexpr value_type value = type::value;
};

template <class N1, class N2>
struct plus<N1, N2> {
  using value_type = typename largest_int<typename N1::value_type,
                                          typename N2::value_type>::type;
  using type = integral_const<value_type, (N1::value + N2::value)>;
  static constexpr value_type value = type::value;
};
```

观察以上的代码可以发现它和以前的版本有两个显著的升级。首先，现在的元函数`plus`支持两个或两个以上的操作数参与到加法运算中，比如`plus<int_<3>, int_<2>, int_<5>, int_<6>>`。显然，为了完成这个目标我们需要实现一个递归，在代码中这个递归的发起点就是`using inner = plus<N2, Nargs...>;`，它使用`plus`计算除`N1`外剩余形参的结果。直到参数个数减少为2时触发结束条件，`struct plus<N1, N2>`计算两个形参之和并返回结果，递归结束。

另外还可以注意到，该版本的`plus`支持不同整型的包装类，这是因为在元函数中调用了

``` c++
largest_int<typename N1::value_type, typename N2::value_type>::type;
```

来获取计算结果的最终类型。因此`plus<int_<3>, uint_<2>>::type`这段代码可以顺利的编译，它的计算结果是`uint_<5>`。

当然，除了加法以外还有一些计算也可以支持多个操作数同时进行，例如乘法、位的与计算以及位的或计算等。而这些计算本质上与`plus`元函数只有运算符上的差别，以乘法为例：

``` c++
template <class N1, class N2, class... Nargs>
struct times {
  using inner = times<N2, Nargs...>;
  using value_type = typename largest_int<typename N1::value_type,
                                          typename inner::value_type>::type;
  using type = integral_const<value_type, N1::value * inner::value>;
  static constexpr value_type value = type::value;
};
template <class N1, class N2>
struct times<N1, N2> {
  using value_type = typename largest_int<typename N1::value_type,
                                          typename N2::value_type>::type;
  using type = integral_const<value_type, (N1::value * N2::value)>;
  static constexpr value_type value = type::value;
};
```

对比元函数`plus`，只是`N1::value + N2::value`被修改为了`N1::value * N2::value`。根据这样的规则，我们可以用宏来简化这类代码为：

``` c++
#define BINARY_MULTI_OP(name, op)                                              \
  template <class N1, class N2, class... Nargs>                                \
  struct name {                                                                \
    using inner = name<N2, Nargs...>;                                          \
    using value_type = typename largest_int<typename N1::value_type,           \
                                            typename inner::value_type>::type; \
    using type = integral_const<value_type, N1::value op inner::value>;        \
    static constexpr value_type value = type::value;                           \
  };                                                                           \
  template <class N1, class N2>                                                \
  struct name<N1, N2> {                                                        \
    using value_type = typename largest_int<typename N1::value_type,           \
                                            typename N2::value_type>::type;    \
    using type = integral_const<value_type, (N1::value op N2::value)>;         \
    static constexpr value_type value = type::value;                           \
  }

BINARY_MULTI_OP(plus, +);
BINARY_MULTI_OP(times, *);
BINARY_MULTI_OP(bitand_, &);
BINARY_MULTI_OP(bitor_, |);
BINARY_MULTI_OP(bitxor_, ^);
```

可以看到我将`+`、`*`、`&`、`|`和`^`归为了一类，并称它们为支持多运算符同时计算的二元运算符元函数。

与支持多操作数的二元运算符不同，减法、除法等运算对于操作数顺序有着严格的要求，所以对于这类运算而言，他们无法支持像加法这种多操作数的运算。也正因如此，减法、除法、移位等这些运算的模板元函数的实现更加的简单了。

``` c++
template <class N1, class N2>
struct minus {
  using value_type = typename largest_int<typename N1::value_type,
                                          typename N2::value_type>::type;
  using type = integral_const<value_type, (N1::value - N2::value)>;
  static constexpr value_type value = type::value;
};
template <class N1, class N2>
struct divides {
  using value_type = typename largest_int<typename N1::value_type,
                                          typename N2::value_type>::type;
  using type = integral_const<value_type, (N1::value / N2::value)>;
  static constexpr value_type value = type::value;
};
```

观察以上代码可知，减法和除法元函数的实现基本上就是加法元函数的一个特化的实现。另外它们也只有一个运算符的区别，同样可以通过宏将其简化为：

``` c++
#define BINARY_SINGLE_OP(name, op)                                          \
  template <class N1, class N2>                                             \
  struct name {                                                             \
    using value_type = typename largest_int<typename N1::value_type,        \
                                            typename N2::value_type>::type; \
    using type = integral_const<value_type, (N1::value op N2::value)>;      \
    static constexpr value_type value = type::value;                        \
  }

BINARY_SINGLE_OP(minus, -);
BINARY_SINGLE_OP(divides, /);
BINARY_SINGLE_OP(modulus, %);
BINARY_SINGLE_OP(left_shift, <<);
BINARY_SINGLE_OP(right_shift, >>);
```

这里`-`、`/`、`%`、`<<`和`>>`被归为一类，也就是普通的二元运算符元函数。

除了以上算数运算符之外，还有一个容易被忽略的运算符——取负运算符。当然，相对于前两种运算符，它的实现就更加简单了：

``` c++
template <class T>
struct negate {
  using value_type = typename T::value_type;
  using type = integral_const<value_type, -T::value>;
  static constexpr value_type value = type::value;
};
```

综合上述运算符元函数，我们来做一道计算题`-((5+(10-2)*3*5/2) << 2)`：

``` c++
using step1 = minus<int_<10>, int_<2>>;                       // step1 = 10-2
using step2 = times<typename step1::type, int_<3>, int_<5>>;  // step2 = step1*3*5
using step3 = divides<typename step2::type, int_<2>>;         // step3 = step2/2
using step4 = plus<int_<5>, typename step3::type>;            // step4 = 5+step3
using step5 = left_shift<typename step4::type, int_<2>>;      // step5 = step4 << 2
using result_step = negate<typename step5::type>;             // result_step = -step5
auto result_value = result_step::value;
```

编译以上代码，编译器计算`result_step`的类型为`int_<-260>`，所以`result_value`为-260。

## 关系运算符元函数

在C++中，想获得两个整数之间的关系是很容易的一件事。比如比较3和7的大小，只需要使用关系运算符`<`或者`>`。但使用C++模板元编程事情就变得不那么容易了，我们需要比较的是整型常量包装类之间关系，比如比较`int_<3>`和`int_<7>`的大小。所以除了算数运算符元函数，YAMPL还应该提供一套描述整型常量包装类之间关系的元函数，这也是C++模板元编程中必不可少的一环。

好在我们已经有了实现算术运算符元函数的基础，再实现一套关系运算符元函数也并不会觉得很难，下面是`==`运算符元函数的实现代码：

``` c++
template <class N1, class N2>
struct equal_to {
  using value_type = bool;
  using type = integral_const<value_type, (N1::value == N2::value)>;
  static constexpr value_type value = type::value;
};
```

上面的代码十分简洁，甚至是在算术运算符元函数中一直发挥重要作用的`largest_int`也被省去了。在`equal_to`元函数中，`value_type`被直接定义为`bool`，这很容易理解，因为关系运算符的计算结果本就是布尔类型。因此，元函数返回的结果`type`就是`integral_const<value_type, true>`或者`integral_const<value_type, false>`。是不是看上去非常熟悉？没错，它们正是`true_type`和`false_type`的定义。

基于和算术类型的元函数同样的原因，关系运算符的元函数也能用宏来做统一的实现：

``` c++
#define BINARY_SINGLE_OP_BOOL(name, op)                                \
  template <class N1, class N2>                                        \
  struct name {                                                        \
    using value_type = bool;                                           \
    using type = integral_const<value_type, (N1::value op N2::value)>; \
    static constexpr value_type value = type::value;                   \
  }

BINARY_SINGLE_OP_BOOL(equal_to, ==);
BINARY_SINGLE_OP_BOOL(not_equal_to, !=);
BINARY_SINGLE_OP_BOOL(greater, >);
BINARY_SINGLE_OP_BOOL(greater_equal, >=);
BINARY_SINGLE_OP_BOOL(less, <);
BINARY_SINGLE_OP_BOOL(less_equal, <=);
```

在上面的代码中`==`、`!=`、`>`、`>=`、`<`和`<=`被归为一类，可以称它们为返回布尔包装类的二元运算符元函数。调用它们将返回`true_type`或者`false_type`，例如：

``` c++
using step1 = typename minus<int_<10>, int_<2>>::type;
using result_type1 = typename equal_to<step1, int_<8>>::type;// true_type
using result_type2 = typename greater<step1, int_<8>>::type; // false_type
using result_type3 = typename less<step1, int_<8>>::type;    // false_type
```
