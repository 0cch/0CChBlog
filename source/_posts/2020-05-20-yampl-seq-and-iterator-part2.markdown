---
author: admin
comments: true
layout: post
slug: 'yampl seq and iterator part2'
title: 序列和迭代器(2)
date: 2020-05-20 17:20:11
categories:
- CPP
---

## list序列

`list`序列实际上就是曾经介绍的`seq`序列的加强版，它的定义如下：

``` c++
struct list_tag {};

template <class... Args>
struct list {
  using iterator_category_tag = forward_iterator_tag;
  using tag = list_tag;
};
```

可以看到，`list`序列是一个有可变模板形参的类模板，它有两个内嵌类型分别是`iterator_category_tag`和`tag`。其中`tag`指示该序列的类型是`list_tag`，``iterator_category_tag``指示`list`序列的迭代器类型是正向迭代器`forward_iterator_tag`。除了正向迭代器的`tag`，YAMPL还定义了双向和随机访问迭代器。

| 迭代器名称     | 定义                         |
| -------------- | ---------------------------- |
| 正向迭代器     | `forward_iterator_tag`       |
| 双向迭代器     | `bidirectional_iterator_tag` |
| 随机访问迭代器 | `random_access_iterator_tag` |

正如上一节所说，要完成一个正向迭代器的序列需要实现至少7组基础元函数。接下来我们会逐一的实现这些元函数。

### `begin_impl`元函数

``` c++
template <>
struct begin_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class... Args>
  struct apply<T<Args...>> {
    using type = iterator<T<Args...>, integral_const<int, 0>, T<Args...>>;
  };
};
```

根据上面的代码，让我们来详细的观察`begin_impl`的实现。首先可以看到`template <> struct begin_impl<list_tag>`是一个`template <class Tag> struct begin_impl {};`针对`list_tag`的特化版本。它的作用就是让告知编译器在处理`tag`为`list_tag`的序列时，选用`template <> struct begin_impl<list_tag>`这个元函数。回过头来看`begin`元函数的实现，

``` c++
template <class T>
struct begin : begin_impl<typename sequence_tag<T>::type>::template apply<T> {};
```

`begin_impl`元函数调用了`sequence_tag`来获取序列的`tag`，从而让编译器能够正确选择`begin_impl`的版本。`sequence_tag`的实现很简单，就是获取类型的`tag`并返回。

``` c++
template <class T>
struct sequence_tag {
  using type = typename T::tag;
};
```

接着观察`begin_impl<typename sequence_tag<T>::type>::template apply<T>`的`apply<T>`，我们发现在编译器选择了正确的`begin_impl`后，真正发挥作用的是内嵌元函数`template <class T> struct apply`，它的任务是处理`begin`传入的模板参数`T`，并且返回第1个迭代器。

``` c++
template <template <class...> class T, class... Args>
struct apply<T<Args...>> {
  using type = iterator<T<Args...>, integral_const<int, 0>, T<Args...>>;
};
```

`apply`的实现并不复杂，需要注意的是返回迭代器中模板实参的含义。第一个实参`T<Args...>`是记录当前迭代器所代表的元素以及该元素之后所有元素的序列，比方说现在有一个迭代器的第一个实参为`list<int, char, double>`，那么它的下一个迭代器的第一个实参应该是`list<char, double>`。第二个实参`integral_const<int, 0>`是用来记录当前迭代器在序列中的位置，因为`begin`返回的是序列的第一个迭代器，所有其位置应该是0。最后的实参`T<Args...>`对整个序列的记录，由于是首个迭代器所以这个实参看起来和第一个实参相同。另外需要注意的是在正向迭代器中，第三个实参并没有什么作用，之所以给出了这个定义是因为YAMPL还为`list`实现了一个双向迭代器的版本。

### `end_impl`元函数

``` c++
template <>
struct end_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class... Args>
  struct apply<T<Args...>> {
    using type =
        iterator<T<>, integral_const<int, sizeof...(Args)>, T<Args...>>;
  };
};
```

`end_impl`的实现和`begin_impl`基本相同，唯一的区别是内嵌元函数`apply`返回的迭代器的定义不同，它将返回序列最后一个元素之后的迭代器。该迭代器的第一个实参为`T<>`，这说明该迭代器已经没有代表的元素了。第二个实参`integral_const<int, sizeof...(Args)>`同样表示当前迭代器在序列的位置。最后的实参`T<Args...>`还是对整个序列的记录。

### `size_impl`元函数

``` c++
template <>
struct size_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class... Args>
  struct apply<T<Args...>> {
    using type = integral_const<int, sizeof...(Args)>;
  };
};
```

`size_impl`的内嵌元函数`apply`返回的是序列中元素的数量`integral_const<int, sizeof...(Args)>`。

### `clear_impl`元函数

``` c++
template <>
struct clear_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class... Args>
  struct apply<T<Args...>> {
    using type = T<>;
  };
};
```

`clear_impl`的内嵌元函数`apply`返回的是空序列`T<>`。

### `push_back_impl`元函数

``` c++
template <>
struct push_back_impl<list_tag> {
  template <class T, class U>
  struct apply;

  template <template <class...> class T, class U, class... Args>
  struct apply<T<Args...>, U> {
    using type = T<Args..., U>;
  };
};
```

`push_back_impl`的内嵌元函数`apply`和之前我们看到的`apply`元函数有一些区别，它需要两个模板参数，这也正是`push_back`元函数所需的模板参数。

``` c++
template <class T, class U>
struct push_back
    : push_back_impl<typename sequence_tag<T>::type>::template apply<T, U> {};
```

其中实参`T`是序列本身，实参U是需要插入序列的元素。最终`apply`返回的是插入新元素之后的序列`T<Args..., U>`。

### `next_impl`元函数

``` c++
template <>
struct next_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class U, class N, class B,
            class... Args>
  struct apply<iterator<T<U, Args...>, N, B>> {
    using type = iterator<T<Args...>, typename N::next, B>;
  };

  template <template <class...> class T, class U, class N, class B>
  struct apply<iterator<T<U>, N, B>> {
    using type = iterator<T<>, typename N::next, B>;
  };
};
```

`next_impl`的内嵌元函数`apply`是一个针对迭代器的元函数，之前我们看到的无论是`begin_impl`还是`push_back_impl`的`apply`元函数都是针对序列本身的。这一点从`next`的定义中也能看出点端倪。

``` c++
template <class T>
struct next
    : next_impl<typename iterator_sequence_tag<T>::type>::template apply<T> {};
```

我们发现，`next_impl`并没有调用`sequence_tag`获取序列`tag`，而是采用`iterator_sequence_tag`元函数获取迭代器所属序列的`tag`，所以这里`next`元函数操作的主体对象是迭代器而不是序列。

回头来看`next_impl`中`apply`的代码，可以看到`apply`有两个特化版本，首先当模板实参为`iterator<T<U, Args...>, N, B>`时，说明该迭代器不是倒数第二个迭代器，那么`apply`的返回结果应该是下个迭代器`iterator<T<Args...>, typename N::next, B>`。请注意，因为我们知道模板形参`N`是一个`integral_const`类型，所以可以直接使用`N::next`获取它的下一个整型包装类。

接下来当模板实参为`iterator<T<U>, N, B>`时，说明它是序列中倒数第二个迭代器。这时`apply`应该与`end`元函数返回一个相同的迭代器`iterator<T<>, typename N::next, B>`。

### `deref_impl`元函数

``` c++
template <>
struct deref_impl<list_tag> {
  template <class T>
  struct apply;

  template <template <class...> class T, class N, class U, class B,
            class... Args>
  struct apply<iterator<T<U, Args...>, N, B>> {
    using type = U;
  };

  template <template <class...> class T, class N, class B>
  struct apply<iterator<T<>, N, B>> {
    using type = none;
  };
};
```

`deref_impl`和`next_impl`一样也是针对迭代器的元函数，它对迭代器进行解引用操作，随后可以获得元素本身。观察`deref_impl`的内嵌`apply`元函数，它也有两个特化版本。当其实参的迭代器为`iterator<T<U, Args...>, N, B>`时，说明它不是最后一个迭代器，于是返回当前元素`U`。当实参的迭代器为`iterator<T<>, N, B>`时，说明这是最后一个迭代器，它不包含任何元素，所以返回`none`。这里的`none`是YAMPL专门为类似这种情况定义的类型，用来表示没有意义的结果，具体定义如下：

``` c++
struct none_tag {};
struct none {
  using tag = none_tag;
};
```

 ## `list`序列和迭代器的基本用法

熟悉STL的读者一定对迭代器的使用了如指掌，因为STL中关于容器的大部分函数都依赖迭代器。比如从`std::list`的容器中删除一个元素就需要使用迭代器指明元素的位置。

``` c++
std::list<int> mylist{0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
mylist.erase(mylist.begin());
```

模板元编程中序列和迭代器的使用方法和STL的迭代器比较类似，只是代码的写法上有些不同，总的来说还算比较容易掌握。以下是一段调用并验证`yampl::list`基本元函数的代码：

``` c++
std::cout << std::boolalpha;
using my_list = list<int_<0>, int_<1>, int_<2>, int_<3>, int_<4>>;
std::cout << "my_list size = " << size<my_list>::type::value << std::endl;

using it0 = typename begin<my_list>::type;
using elem0 = typename deref<it0>::type;
std::cout << "elem0 == int_<0> : "
          << std::is_same_v<elem0, int_<0>> << std::endl;

using it1 = typename next<it0>::type;
using elem1 = typename deref<it1>::type;
std::cout << "elem1 == int_<1> : "
          << std::is_same_v<elem1, int_<1>> << std::endl;

using it2 = typename next<it1>::type;
using it3 = typename next<it2>::type;
using it4 = typename next<it3>::type;
using elem4 = typename deref<it4>::type;
std::cout << "elem4 == int_<4> : "
          << std::is_same_v<elem4, int_<4>> << std::endl;

std::cout << "next<it4>::type == end<my_list>::type : "
          << std::is_same_v<typename next<it4>::type,
                            typename end<my_list>::type> << std::endl;

using empty_list = typename clear<my_list>::type;
using my_list2 = typename push_back<empty_list, int_<5>>::type;
std::cout << "my_list2 == list<int_<5> : "
          << std::is_same_v<my_list2, list<int_<5>>> << std::endl;
```

在上面的代码中，首先定义了一个`list`序列`my_list`，序列共有5个元素，它们从`int_<0>`递增至`int<4>`。使用`size`元函数可以获取`my_list`中元素个数，这里返回的是`int_<5>`，通过`::value`可以获取整型数字5，所以第一句`std::cout`输出结果为：

```
my_list size = 5
```

接着，代码调用`begin`元函数返回了序列`my_list`的第一个迭代器`it0`，可以预见到这个迭代器解引用后的元素就是`int_<0>`。为了证明这一点，使用元函数`deref`可以对`it0`解引用并获得结果`elem0`，再使用`std::is_same_v<elem0, int_<0>>`验证类型是否相同，输出结果为：

```
elem0 == int_<0> : true
```

为了获取下一个迭代器，可以使用元函数`next`，这样可以获取迭代器`it1`。通过同样的方式我们可以获取`it2`到`it4`，并且对它们的类型进行判断：

```
elem1 == int_<1> : true
elem4 == int_<4> : true
```

`it4`的下一个迭代器是`my_list`中最后一个迭代器，应该与`end`元函数返回的结果相同。我们同样可以通过`std::is_same_v<typename next<it4>::type, typename end<my_list>::type>`来验证这个结论：

```
next<it4>::type == end<mylist>::type : true
```

最后，代码中使用`clear`元函数返回一个空`list`序列，并且调用`push_back`将`int_<5>`插入到序列之中并获得序列`my_list2`。用同样的方法再次验证`push_back`和`clear`元函数的正确性，得到输出结果：

```
my_list2 == list<int_<5> : true
```