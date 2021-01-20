---
author: admin
comments: true
layout: post
slug: 'yampl seq and iterator part3'
title: 序列和迭代器(3)
date: 2020-06-15 18:15:30
categories:
- CPP
---

## `list`序列的更多元函数

那么目前为止，我们完成了`list`序列7组基本元函数的调用和验证。不过我们不会就此满足，因为以上元函数能完成的工作有限，为了让序列能完成更多实用的功能，我们还需要进一步的对基础元函进行组合。有一个特别的好消息是，由于后续介绍的元函数都是由以上7组基本元函数组合而成，所以它们可以在任何正向迭代器的序列中使用。不仅如此，如果不是特别在意编译期的效率问题的话，将他们应用于双向迭代器或者随机访问迭代器的序列也是可以的。当然我并不推荐这么做，因为对于双向迭代器或者随机访问迭代器的序列，它们可以使用更灵活的方法操作和访问内部元素。

### `push_front`元函数

``` c++
template <class Tag>
struct push_front_impl {
  template <class R, class I, class E>
  struct apply_impl {
    using inner = typename push_back<R, typename deref<I>::type>::type;
    using type = typename apply_impl<inner, typename next<I>::type, E>::type;
  };

  template <class R, class E>
  struct apply_impl<R, E, E> {
    using type = R;
  };

  template <class T, class U>
  struct apply {
    using init = typename push_back<typename clear<T>::type, U>::type;
    using type = typename apply_impl<init, typename begin<T>::type,
                                     typename end<T>::type>::type;
  };
};

template <class T, class U>
struct push_front
    : push_front_impl<typename sequence_tag<T>::type>::template apply<T, U> {};
```

从上面的代码可以看出`push_front`是一个极为典型的组合元函数，它使用`begin`、`end`、`deref`、`clear`和`push_back`两个元函数的组合，所以它可以用于任何正向迭代器的序列。不过达到这个目的的代价可以不小，因为这个操作从效率上来说是很低的。观察`push_front_impl`的实现可知，该元函数首先调用`clear`元函数获取一个空的序列，接着将目标元素`push_back`到新的空序列中，

``` c++
using init = typename push_back<typename clear<T>::type, U>::type;
```

并且使用`begin`、`end`和`deref`遍历了原始序列并且按照顺序逐个插入新序列。

``` c++
using type = typename apply_impl<init, typename begin<T>::type,
                                     typename end<T>::type>::type;
```

### `pop_back`和`pop_front`元函数

``` c++
template <class Tag>
struct pop_back_impl {
  template <class R, class I, class N, class E>
  struct apply_impl {
    using inner = typename push_back<R, typename deref<I>::type>::type;
    using type = typename apply_impl<inner, typename next<I>::type,
                                     typename next<N>::type, E>::type;
  };

  template <class R, class I, class E>
  struct apply_impl<R, I, E, E> {
    using type = R;
  };

  template <class T>
  struct apply {
    using init = typename clear<T>::type;
    using type =
        typename apply_impl<init, typename begin<T>::type,
                            typename next<typename begin<T>::type>::type,
                            typename end<T>::type>::type;
  };
};

template <class T>
struct pop_back
    : pop_back_impl<typename sequence_tag<T>::type>::template apply<T> {};

template <class Tag>
struct pop_front_impl {
  template <class R, class I, class E>
  struct apply_impl {
    using inner = typename push_back<R, typename deref<I>::type>::type;
    using type = typename apply_impl<inner, typename next<I>::type, E>::type;
  };

  template <class R, class E>
  struct apply_impl<R, E, E> {
    using type = R;
  };

  template <class T>
  struct apply {
    using init = typename clear<T>::type;
    using type =
        typename apply_impl<init, typename next<typename begin<T>::type>::type,
                            typename end<T>::type>::type;
  };
};

template <class T>
struct pop_front
    : pop_front_impl<typename sequence_tag<T>::type>::template apply<T> {};
```

事实上，`pop_back`和`pop_front`元函数与`push_front`元函数的实现思路基本上是一样的。它们都使用`clear`元函数创建了一个空序列，然后再往空序列中填充各自的元素。唯一的区别就在于，`pop_back`元函数会检查下一个迭代器是否为结束迭代器。如果确定是结束迭代器，那么元函数就会忽略当前迭代器，直接返回当前新序列。

``` c++
using type = typename apply_impl<inner, typename next<I>::type,
                                     typename next<N>::type, E>::type;
```

而`pop_front`则是从一开始遍历原始序列迭代器的时候就用`next`元函数忽略首个迭代器。

``` c++
using type =
        typename apply_impl<init, typename next<typename begin<T>::type>::type,
                            typename end<T>::type>::type;
```

### `insert`元函数

上面已经介绍了三个组合而成的元函数，它们的实现虽说比较简单，但是却阐明了这类元函数的基本思路，即创建新的序列，然后遍历原始序列将需要的元素逐个插入到新序列中。现在让我们看一个较为复杂的`insert`元函数。

``` c++
template <class Tag>
struct insert_impl {
  template <class R, class U, class B, class I, class E>
  struct apply_impl {
    using inner = typename push_back<R, typename deref<I>::type>::type;
    using type =
        typename apply_impl<inner, U, B, typename next<I>::type, E>::type;
  };

  template <class R, class U, class I, class E>
  struct apply_impl<R, U, I, I, E> {
    using inner = typename push_back<R, U>::type;
    using inner2 = typename push_back<inner, typename deref<I>::type>::type;
    using type =
        typename apply_impl<inner2, I, U, typename next<I>::type, E>::type;
  };

  template <class R, class U, class B, class E>
  struct apply_impl<R, U, B, E, E> {
    using type = R;
  };

  template <class R, class U, class E>
  struct apply_impl<R, U, E, E, E> {
    using type = typename push_back<R, U>::type;
  };

  template <class T, class B, class U>
  struct apply {
    using init = typename clear<T>::type;
    using type = typename apply_impl<init, U, B, typename begin<T>::type,
                                     typename end<T>::type>::type;
  };
};

template <class T, class U, class B>
struct insert
    : insert_impl<typename sequence_tag<T>::type>::template apply<T, B, U> {};
```

上面的代码总体思路没有变化，先通过`clear`创建了新序列，难点是如何遍历原始序列并且找到目标位置插入新元素。这里让我们把注意力放在4个版本的`apply_impl`上，首先来看通常版本的元函数：

``` c++
template <class R, class U, class B, class I, class E>
  struct apply_impl {
    using inner = typename push_back<R, typename deref<I>::type>::type;
    using type =
        typename apply_impl<inner, U, B, typename next<I>::type, E>::type;
  };
```

该元函数非常简单，通过`push_back`将原序列的元素插入到新序列中，其中`I`是迭代器。

``` c++
template <class R, class U, class I, class E>
  struct apply_impl<R, U, I, I, E> {
    using inner = typename push_back<R, U>::type;
    using inner2 = typename push_back<inner, typename deref<I>::type>::type;
    using type =
        typename apply_impl<inner2, I, U, typename next<I>::type, E>::type;
  };
```

第二个的`apply_impl`是一个特化版本，它限定了当当前迭代器`I`与目标迭代器相同的时候，将新元素`U`插入到新序列中，然后再插入迭代器`I`的元素，这样就能完成插入目标元素`U`到指定迭代器之前的任务。

``` c++
template <class R, class U, class B, class E>
  struct apply_impl<R, U, B, E, E> {
    using type = R;
  };

template <class R, class U, class E>
  struct apply_impl<R, U, E, E, E> {
    using type = typename push_back<R, U>::type;
  };
```

最后两个特化版本的`apply_impl`限定了元函数的结束条件。一方面`apply_impl<R, U, B, E, E>`，当原序列遍历到结束迭代器时，如果插入目标位置不是结束迭代器，则插入操作直接结束，返回新序列。另一方面`apply_impl<R, U, E, E, E>`，当原序列遍历到结束迭代器时，如果插入目标位置正好是结束迭代器，那么就将目标元素`U`插入到新序列的末尾。

以下是一个调用`insert`元函数的示例：

``` c++
using insert_list = list<int, bool, char>;
using result_list = insert<insert_list, short, begin<insert_list>::type>::type;
```

示例代码中，`insert`元函数将`short`类型插入了`insert_list`序列的`begin`迭代器之前，于是`result_list`的结果应该是`list<short, int, bool, char>`。

### 其他组合元函数

除了我们上面介绍的`push_front`、`pop_back`、`pop_front`和`insert`元函数以外，我们还能根据自己的需要实现其他的元函数。比如，用于删除元素的`erase`元函数，用于排重的`unique`元函数，用于逆向排序的`reverse`元函数以及用于查找元素的`find`元函数等等。它们虽然有各自不同的功能，但是实现思路上确实万变不离其宗的。有兴趣的读者不妨自己尝试动手实现一两个。