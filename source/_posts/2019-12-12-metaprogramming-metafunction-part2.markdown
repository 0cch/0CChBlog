---
author: admin
comments: true
layout: post
slug: 'metaprogramming metafunction part2'
title: 元函数和序列(2)
date: 2019-12-12 21:54:26
categories:
- CPP
---

接着上一篇的话题

## 序列

一说到序列，我们很容易想到STL中的容器`vector`。相对于数组，C++程序员显然更喜欢`vector`，这不仅是因为`vector`可以动态的扩展容器的空间，更是因为STL为它提供了一系列使用算法，比如插入、查找等等。事实上，关于STL序列的设计思路放在C++模板元编程中也同样适用。要知道，Boost.MPL中的大多数算法都是操作于序列之上的，它能够发挥模板元编程更大潜力，也正因如此序列对于模板元编程才如此的重要。

当然，相对于STL的`vector`使用于运行期，模板元编程的序列必须是在编译阶段就能够存储数据的，所以我们能够使用的也只有类模板，例如：

``` c++
template <class... Args>
struct seq {};
```

`seq`是一个最简单的序列，但千万别小瞧了它，因为它能够容纳任意多个元素。而实现这一能力的关键是C++11标准中引入的可变模板参数的特性，所以这里`seq`真正存储数据的是模板参数，比如：

``` c++
using integer_list = seq<int, short, char>;
```

在上面的代码中，类模板实参`<int, short, char>`为序列`seq`的保存元素。好了，现在我们已经有了一个最基本的序列，接下来还需要准备一些配合序列的算法。继续对比STL的`vector`，最常用的`vector`算法应该是成员函数`push_back`，那么我们也来给`seq`实现一个编译阶段的`seq_push_back`元函数。这听起来似乎有些难度，不过事实上在可变模板形参的基础上实现`push_back`算法是很容易的：

``` c++
template <class S, class T>
struct seq_push_back;

template <class T, class... Args>
struct seq_push_back<seq<Args...>, T> {
	using type = seq<Args..., T>;
};
```

在上面的代码中，首先声明了一个元函数`seq_push_back`，它有两个形参分别为`S`和`T`，其中`S`表示序列，而`T`代表即将插入的元素。接着代码偏特化了一个`seq_push_back`，该版本对`S`为`seq`的情况定义了元函数的具体实现。请注意这里的实现细节，因为后文中很多算法的实现都基于这个思路。在这个版本中引入了可变形参`class... Args`，并且将其运用于特化的参数中`struct seq_push_back<seq<Args...>, T>`，这样就可以利用编译器推导出`Args`的具体实参。最终通过`Args`定义新的`seq`类型以达到`push_back`算法的目的：`using type = seq<Args..., T>;`。值得注意的是，元函数`seq_push_back`并没有提供通用版本的实现，所以当模板实参`S`不是`seq`类型的时候编译将无法正确进行。

## 选择结构

在C++模板元编程中代码的选择结构是由元函数实现的。这一点比较容易理解，毕竟类模板的特化正好适合来做这件事，例如：

``` c++
template <bool C, class T, class F>
struct if_ {
	using type = T;
};

template <class T, class F>
struct if_<false, T, F> {
	using type = F;
};
```

上面的代码实现了两个版本的`if_`元函数，其中通用版本无条件的返回模板形参`T`，而针对模板形参`C`为`false`的偏特化版本返回的则是模板形参`F`。这样一来元函数就可以根据模板形参`C`的具体值返回不同的类型，例如：

``` c++
if_<false, int, double>::type double_value;
if_<true, int, double>::type int_value;
```

作为模板元编程中编写选择结构的常用技巧，STL也实现了一份类似的代码，不过在STL中元函数的函数名为`conditional`，除此以外基本上没有差异包括调用方式：

``` c++
std::conditional<true, int, double>::type
```

请注意，无论是上面的`if_`还是`std::conditional`都存在一个问题，那就是将数值和类型计算混合了。我们希望能有一个只有类型计算的`if_`版本。想达到这个目的需要用到编写`plus`元函数时的同一个技巧，即创建一个布尔值和类型之前的桥梁：

``` c++
template <bool C>
struct bool_ {
	static constexpr bool value = C;
};

using true_type = bool_<true>;
using false_type = bool_<false>;
```

在上面的代码中，我们将数值和类型进行了转换，数值`true`和`false`分别转换为了类型`true_type`和`false_type`。于此同步的，`if_`也需要进行一些修改：

``` c++
template <bool C, class T, class F>
struct if_c {
	using type = T;
};

template <class T, class F>
struct if_c<false, T, F> {
	using type = F;
};

template <class C, class T, class F>
struct if_ {
	using type = typename if_c<!!C::value, T, F>::type;
};
```

在上面的代码中存在两个选择元函数`if_c`和`if_`，其中`if_c`的实现和上一个版本的`if_`一样，通过布尔值`C`来确定返回的类型。相对的，当前版本的`if_`元函数的第一个参数`C`是类型而非是布尔值，进一步来说这个类型`C`必须是一个带有常量静态数据成员`value`的类型。元函数`if_`会通过`!!C::value`的方法将数值转换成布尔值，最终调用`if_c`返回目标类型。

由于元函数`if_`的形参发生了改变，其调用方法也需要做相应的调整：

``` c++
if_<false_type, int, double>::type double_value;
if_<true_type, int, double>::type int_value;
```

“`if_`是改写好了，但是我到目前为止并没有发现这样大动干戈改写的任何好处呀？”相信很多读者会有这样的疑问。这很好，不过现在还不是解释这个问题的最佳时机，请先相信这样的修改一定会带来某种优势吧。

## 循环结构

与选择结构不同，循环结构没有惯用元函数的具体实现。一般来说，模板元编程中的循环都是根据实际需要来实现的。不过好在它们的实现都有固定的方法和模式，所以总体而言并不算难。让我们先看一个例子：

``` c++
template <int... Args>
struct sum;

template <int N, int... Args>
struct sum<N, Args...> {
	static constexpr int value = N + sum<Args...>::value;
};

template <int N>
struct sum<N> {
	static constexpr int value = N;
};
```

在上面的代码中，元函数`sum`有3个版本，其中通用版本的

``` c++
template <int... Args>
struct sum;
```

只有声明却没提供实现，而真正的实现是由它的两个特化版本来完成的。首先`struct sum<N, Args...>`是一个通过递归完成循环的元函数，它的返回值是第一个形参`N`与使用剩余形参调用的`sum`的返回值之和，这样理所当然的形成了一个循环结构。请注意，在普通的C++编程中，我们经常会用到无限循环，但是在模板元编程中无限循环不具有任何意义，毕竟谁也不想自己的程序永远无法通过编译。事实上也真不会发生这样的事情，因为编译器最终会由于递归过多而停止编译并报错。所以在元编程的循环结构中，我们需要为其准备一个有效的结束条件。在本例中，这个结束条件就是`struct sum<N>`，它定义当`sum`的形参只剩下一个时递归结束，直接返回形参`N`，至此整个递归开始折返。

调用元函数`sum`:

``` c++
auto val = sum<1, 2, 3, 4>::value;
```

这句代码在编译器中的计算顺序相当于：

``` c++
auto val = 1 + (2 + (3 + (4)));
```

也正是递归操作的顺序。

以上是一个数值计算的求和元函数，按照惯例我们实际期望的是类型计算元函数。接下来我们可以利用之前介绍的`plus`元函数来实现一个类型计算的求和元函数：

``` c++
template <class... Args>
struct sum;

template <class N, class... Args>
struct sum<N, Args...> {
	using type = typename plus<N, typename sum<Args...>::type>::type;
};

template <class N>
struct sum<N> {
	using type = N;
};

auto val = sum<int_<1>, int_<2>, int_<3>, int_<4>>::type::value;
```

可以看到在上面的代码中关于数值计算的痕迹都被抹去，元函数的调用方式也发生了略微的变化。但是不变的是实现循环结构的方法。在代码中`using type = typename plus<N, typename sum<Args...>::type>::type;`虽然冗长但还算清晰，很明显`type`的结果依赖元函数`plus`计算的结果，而`plus`的计算结果又依赖于`sum`的第一个形参与剩余形参调用`sum`的计算结果，这样就形成了递归，除多了一步`plus`的调用以外其他过程基本上和上一个版本一致。另外，同样一致的还有递归的结束条件，`struct sum<N>`与上一个版本唯一的区别是返回类型本身而不是返回数值。

根据以上两个例子我们可以总结出模板元编程循环结构的两个关键点：更新形参递归并调用元函数本身以及定义有效的结束条件。让我们带上这两个关键点来看下一个例子，这个例子结合了上文提到的序列和选择结构，实际上循环和选择正是序列相关算法的关键，在真实的模板元编程代码中它们是最好的搭档。

``` c++
template <class T>
struct result_wrap {
	using type = T;
};

template <class S>
struct seq_is_all_reference;

template <class T, class... Args>
struct seq_is_all_reference<seq<T, Args...>> {
	using cond = typename std::is_reference<T>::type;
	using result = typename if_<cond, seq_is_all_reference<seq<Args...>>, result_wrap<false_type>>::type;
	using type = typename result::type;
};

template <class T>
struct seq_is_all_reference<seq<T>> {
	using cond = typename std::is_reference<T>::type;
	using type = typename if_<cond, true_type, false_type>::type;
};
```

在上面的代码中，元函数`seq_is_all_reference`的作用是判断序列`seq`中的元素是否全都是引用类型，如果都是引用类型就返回`true_type`，否则返回`false_type`。在实现上`seq_is_all_reference`相对复杂一些，因为代码中循环和选择发生了互相嵌套的情况。`seq_is_all_reference<seq<T, Args...>>`首先判断第一个参数`T`是否为引用类型，并将结果`cond`作为实参调用元函数`if_`。接下来`if_`判断`cond`的结果，如果结果为`std::true_type`则进入递归流程`seq_is_all_reference<seq<Args...>`，目的是判断后续的参数是否为引用类型。如果`cond`的结果是`std::false_type`，那么循环终止并返回`false_type`。请注意，这里`cond`是`std::is_reference<T>`返回的结果，所以结果类型是`std::true_type`或者`std::false_type`，而`seq_is_all_reference`是我们自己的元函数，其返回结果是`true_type`或者`false_type`。另外，读者可能也发现了，在`seq_is_all_reference`的循环结束条件并非只有一个。比较明显的是`seq_is_all_reference<seq<T>>`，它定义当形参只剩一个的情况下元函数返回`cond`的结果。除此之外，`seq_is_all_reference<seq<Args...>`还隐含了一个结束条件，就是当`cond`为`std::false_type`时递归中断并返回结果。

``` c++
using test_seq1 = seq<int&, double, short&>;
using test_seq2 = seq<int&, double&, short&>;

using result_type1 = seq_is_all_reference<test_seq1>::type;	// result_type1为false_type
using result_type2 = seq_is_all_reference<test_seq2>::type; // result_type2为true_type
```

以上代码演示了对`seq_is_all_reference`的使用方法。其中序列`test_seq1`中由于`double`不是引用类型的关系，所以返回结果是`false_type`。而序列`test_seq2`中的所有元素都是引用类型于是返回了`true_type`。来看一个更加实际的例子：

``` c++
template <class... Args>
class some_class_need_ref {
	static_assert(seq_is_all_reference<seq<Args...>>::type::value);
};

some_class_need_ref<int&, double&> obj1;	// 编译成功
some_class_need_ref<int&, double> obj2;		// 触发static_assert，编译失败
```

上面的代码定义了一个特别的类模板，它要求模板参数必须都是引用类型。它在定义中加上了`static_assert(seq_is_all_reference<seq<Args...>>::type::value);`以检查调用者是否正确实例化了类模板。在编译的过程中，编译器发现`obj2`的类型`some_class_need_ref<int&, double>`的模板参数并不是规定中的引用类型，于是`static_assert`被触发导致编译失败。



到目前为止，我们已经了解了C++模板元编程中元函数和序列的基本概念和使用方法。另外我们还看到了用元函数来控制选择和循环等代码流程的方法，之后我们将选择和循环结合在一起完成了一个判断序列中的所有元素是否为引用类型的元函数示例。可以说我们现在已经有办法独立编写一些模板元程序了。接下来的文章将会更进一步，我们将会接触到更为复杂的元程序，在那里我们会一起实现一个轻量级C++模板元编程库——YAMPL。