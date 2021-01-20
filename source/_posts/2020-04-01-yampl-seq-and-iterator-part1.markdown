---
author: admin
comments: true
layout: post
slug: 'yampl seq and iterator part1'
title: 序列和迭代器(1)
date: 2020-04-01 07:36:51
categories:
- CPP
---

在前面的篇幅中我们已经看到了序列在模板元编程中的一部分作用。在本篇中我们将更加深入的探讨序列以及与之相关的算法，同时我们会使用建立迭代器的方法将这些算法抽象出来以方便它们运用到不同类型的序列中。在YAMPL中实现了两种类型的序列`list`和`vector`，本章中我将着重介绍`list`序列，这是因为该序列更好的使用了C++11的特性。另外本篇中介绍的算法基本上都是使用迭代器实现，所以它们可以顺利的移植到`vector`上。读者也可以将这些算法移植到自己实现的序列上，而这个移植过程也只需要实现少量代码。

## 定义迭代器

为了保证序列相关算法的通用性，我们需要将算法的实现建立在迭代器的基础之上，于是设计一个通用的迭代器就变得十分重要了。以下代码是YAMPL中通用迭代器类模板的定义：

``` c++
struct iterator_tag {};

template <class T, class N, class B = void, class B2 = void, class B3 = void>
struct iterator {
  using type = T;
  using index = N;
  using backup = B;
  using backup2 = B2;
  using backup3 = B3;
  using tag = iterator_tag;
};
```

在上面的代码中，迭代器`iterator`定义了5个模板形参。其中第一个形参`T`通常用于记录当前迭代器代表的元素本身或者是记录与该元素相关的序列；第二个形参`N`通常用于记录当前迭代器在序列中的位置；而剩下的3个形参可以用来记录一些额外的序列信息。

值得注意的是，以上描述是这5个形参在YAMPL序列中的惯用用法，它们并不是绝对的，所以序列的设计者可以根据序列本身的实际情况安排这5个形参的用途。比如YAMPL中的`list`使用了前3个形参，而`vector`只使用了前2个形参。

最后来说明一下内嵌类型`tag`的用途。在YAMPL中，和序列相关的类模板都有一个`tag`，比如迭代器的`tag`就是`iterator_tag`。这些`tag`的主要功能是对序列相关的类模板进行分类以方便通用算法在不同的序列上正常工作。例如YAMPL的`list`序列的`tag`为`list_tag`，那么为`list_tag`设计的基础元函数就能使用在`list`序列之上。同样的道理，若序列的设计者为了某特殊情况定义了一个`special_list`序列，并且将其`tag`定义为`list_tag`，那么为`list_tag`设计的算法就可以用于该序列了。

## 序列和迭代器的基础元函数

为了让迭代器能顺利的移植到不同的序列上，我们需要定义几个抽象的元函数。这些元函数有些类似C++纯虚函数的概念，它们只提供一个元函数的轮廓，而具体是定义还是要由序列的设计者来实现。这些基础元函数包括：

``` c++
template <class Tag>
struct begin_impl {};

template <class T>
struct begin : begin_impl<typename sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct end_impl {};

template <class T>
struct end : end_impl<typename sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct next_impl {};

template <class T>
struct next
    : next_impl<typename iterator_sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct deref_impl {};

template <class T>
struct deref
    : deref_impl<typename iterator_sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct size_impl {};

template <class T>
struct size : size_impl<typename sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct clear_impl {};

template <class T>
struct clear : clear_impl<typename sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct push_back_impl {};

template <class T, class U>
struct push_back
    : push_back_impl<typename sequence_tag<T>::type>::template apply<T, U> {};
```

上面的代码展示了7组基础元函数，它们分别是`begin`、`end`、`next`、 `deref`、`size`、`clear`和`push_back`。之所以把它们列为基础元函数，是因为要让一个序列和与之相关的迭代器能正常工作这7组元函数是必不可少的。如果一个序列能实现这7组元函数，那么它的迭代器至少能完成一个正向迭代器的全部工作。

这7组元函数的功能具体为：

| 元函数      | 说明                                         |
| :---------- | :------------------------------------------- |
| `begin`     | 返回序列中代表第一个元素的迭代器；           |
| `end`       | 返回序列中代表最后一个元素之后的迭代器；     |
| `next`      | 返回当前迭代器代表元素的下一个元素的迭代器； |
| `deref`     | 解引用，返回当前迭代器代表的元素本身；       |
| `size`      | 返回序列中元素个数；                         |
| `clear`     | 删除序列中的所有元素；                       |
| `push_back` | 在序列的最后新增一个元素。                   |

如果序列的设计者并不满足于正向迭代器的功能，那么还可以实现一个`prior`元函数的`_impl`版本来完成一个双向迭代器，`prior`元函数的定义如下：

``` c++
template <class Tag>
struct prior_impl {};

template <class T>
struct prior
    : prior_impl<typename iterator_sequence_tag<T>::type>::template apply<T> {};
```

`prior`函数的功能具体为：

| 元函数  | 说明                                         |
| ------- | -------------------------------------------- |
| `prior` | 返回当前迭代器代表元素的上一个元素的迭代器。 |

进一步的，如果序列的设计者希望该序列能支持一个随机访问迭代器，那么还需要实现以下2组基础元函数：

``` c++
template <class Tag>
struct advance_impl {};

template <class T, class N>
struct advance
    : advance_impl<typename iterator_sequence_tag<T>::type>::template apply<T,
                                                                            N> {
};

template <class Tag>
struct distance_impl {};

template <class T, class U>
struct distance
    : distance_impl<typename iterator_sequence_tag<T>::type>::template apply<
          T, U> {};
```

这2组元函数的功能具体为：

| 元函数     | 说明                                          |
| ---------- | --------------------------------------------- |
| `advance`  | 返回当前迭代器代表元素的第N个递进元素的迭代器 |
| `distance` | 计算同序列中两个迭代器的间隔元素              |

需要注意的是，序列需要实现的并不是`begin`、`end`、`next`这些元函数本身，而是它们间接调用的`_impl`版本的内嵌`apply`元函数。具体来说，想实现序列的`push_back`功能，那么应该对应的实现`push_back_impl`和`push_back_impl::apply`的元函数，具体的实现方法会在后面`list`序列的小节中介绍。