---
author: admin
comments: true
layout: post
slug: 'yampl base components part3'
title: YAMPL的基础组件(3)
date: 2020-03-08 22:23:33
categories:
- CPP
---

## 逻辑运算符元函数

在C++中逻辑运算符可以将两个或多个关系表达式连接成一个，例如`&&`和`||`，也能够使表达式的逻辑反转，例如`!`。在这个小节中，我们将根据C++的逻辑运算符实现一套YAMPL可以使用的逻辑运算符元函数，除此之外我们还将结合上面的内容来完成一个元编程例子。

``` c++
template <class N1, class N2, class... Nargs>
struct and_ {
  using inner = and_<N2, Nargs...>;
  using value_type = bool;
  using type = integral_const<value_type, N1::value && inner::value>;
  static constexpr value_type value = type::value;
};
template <class N1, class N2>
struct and_<N1, N2> {
  using value_type = bool;
  using type = integral_const<value_type, (N1::value && N2::value)>;
  static constexpr value_type value = type::value;
};
```

观察上面的代码会发现，`and_`元函数的实现和`plus`元函数几乎相同，除了使用了不同的运算符以外，唯一的区别就是返回类型。`and_`元函数的返回类型`using type = integral_const<value_type, N1::value && inner::value>;`固定为`integral_const<bool, true>`或者`integral_const<bool, false>`之一，也就是`true_type`或者`false_type`。这个设计正好是对应`&&`运算符的返回值必须是`true`或者`false`之一。说明了这个区别之后，读者可以回味一下`plus`的实现应该就能理解`and_`元函数的实现细节了，这里也不再赘述。

如`and_`元函数一样，`or_`也可以通过这样的方式实现，而且只需要修改一个运算符而已。所以这里还是用宏简化代码的实现：

``` c++
#define BINARY_MULTI_OP_BOOL(name, op)                                  \
  template <class N1, class N2, class... Nargs>                         \
  struct name {                                                         \
    using inner = name<N2, Nargs...>;                                   \
    using value_type = bool;                                            \
    using type = integral_const<value_type, N1::value op inner::value>; \
    static constexpr value_type value = type::value;                    \
  };                                                                    \
  template <class N1, class N2>                                         \
  struct name<N1, N2> {                                                 \
    using value_type = bool;                                            \
    using type = integral_const<value_type, (N1::value op N2::value)>;  \
    static constexpr value_type value = type::value;                    \
  }

BINARY_MULTI_OP_BOOL(and_, &&);
BINARY_MULTI_OP_BOOL(or_, ||);
```

以上代码实现了逻辑与和逻辑或的运算符元函数，接下来我们需要实现一个逻辑非运算符元函数，也就是在C++中常用的`!`。逻辑非运算符元函数的实现相对于前两个就单纯多了，代码如下：

``` c++
template <class T>
struct not_ {
  using value_type = bool;
  using type = integral_const<value_type, !T::value>;
  static constexpr value_type value = type::value;
};
```

这里只需要注意`not_`元函数的返回类型也是固定为`integral_const<bool, true>`或者`integral_const<bool, false>`之一，剩下的代码和取负运算符元函数的代码几乎相同很容易理解。

现在，我们要利用上面介绍的内容实现一个特殊的函数模板：

``` c++
template<class T>
void special_func(T) {}
```

该函数模板需要完成这样一个任务：当模板实参`T`是一个标量或者引用时，函数参数的`T`为实参本身；否则`T`为实参的引用。也就是说当`T`为`int`时，函数为`void special_func(int) {}`；当`T`为`int&`时，函数为`void special_func(int&) {}`；当T为`std::string`时，函数为`void special_func(std::string&) {}`。

以下是我的一种实现方案：

``` c++
template <class T>
struct func_helper {
  using cond = or_<typename std::is_scalar<T>::type,
                   typename std::is_reference<T>::type>;
  using type = typename if_<typename cond::type, T,
                            typename std::add_lvalue_reference<T>::type>::type;
};

template <class T>
void special_func(typename func_helper<T>::type) {}
```

上面的代码中实现了一个`func_helper`元函数，该元函数会针对`special_func`的模板实参进行处理以满足函数需求。在`func_helper`的实现代码中，首先调用了逻辑或元函数`or_`，用于判断`T`是否为标量或者引用类型。然后根据返回结果调用`if_`元函数。当`cond::type`的结果为`true_type`时返回`T`本身，否则调用`std::add_lvalue_reference`返回`T`的引用类型，最终`type`为要求的返回类型。

来测试一下刚刚编写的函数模板：

``` c++
int n = 1;
special_func<int>(n);
special_func<int&>(n);
std::string s{ "hello" };
special_func<std::string>(s);
```

使用`-fdump-tree-gimple`命令让GCC生成gimple的中间代码，观察代码发现这样三份中间代码：

```
special_func<int> (type v)
{
  GIMPLE_NOP
}
special_func<int&> (int & v)
{
  GIMPLE_NOP
}
special_func<std::__cxx11::basic_string<char> > (struct basic_string & v)
{
  GIMPLE_NOP
}
```

可以看到当模板实参为`int`和`int&`时，函数形参类型为模板实参本身，而当模板实参为`std::__cxx11::basic_string<char>`时，函数形参类型为`struct basic_string &`，满足函数的设计要求。

## 类型打印元函数

模板元程序之所以比普通C++程序更难编写主要是因为它很难调试。我们常用的调试方法在模板元程序上都没法正常使用，比如调试器只能调试动态运行的程序，但是却无法调试编译期执行的元程序。

另外打印日志的方法也许能帮上一点忙，因为C++为我们提供了`typeid`这个操作符，它返回的`std::type_info`结构中存在一个`const char* name()`的成员函数可以返回类型名称。于是我们想到可以使用以下方法打印类型信息帮助调试：

``` c++
std::cout << typeid(T).name();
```

不过遗憾的是，这种方法也并不完美。首先来说，成员函数`name()`返回的类型名称在不同编译器中有不同的展现方法，比如MSVC编译出来的程序返回的是一个可读的名称，而GCC编译出来的程序返回的类型名称则需要使用特定API（例如`abi::__cxa_demangle`）将其转换为可读的名称。其次，`typeid`也无法真实的反应类型的状态，因为C++标准中说明了`typeid`会忽略类型的`cv`属性，也就是说`typeid(const T) == typeid(T)`。所以`typeid`打印日志的方法也不满足需求。

为了准确是输出类型信息，我们需要将目光从程序本身移动到编译期上，因为只有编译期才是掌握类型信息最全面的程序。于是我们可以想到使用编译期的错误信息来打印类型信息。由于错误信息往往是帮助程序员排查错误，所以类型信息会非常的全面。

``` c++
template <class T>
struct err_print_type;

err_print_type<typename minus<int_<10>, int_<2>>::type>();
```

在上面的代码中`err_print_type`是一个缺少实现的类模板，所以当编译器将其进行实例化的时候必然会报错，而错误信息正是我们想要的结果。`err_print_type<typename minus<int_<10>, int_<2>>::type>();`在MSVC中会显示错误信息：

```
error C2027: use of undefined type 'err_print_type<yampl::integral_const<T,8>>'
with
[
    T=int
]
```

在GCC中显示错误信息：

```
error: invalid use of incomplete type 'struct err_print_type<yampl::integral_const<int, 8> >'
```

可以看到，无论是哪种编译器都非常详细的显示了类型信息。

现在类型信息是完整了，但这种方法还是不太好，因为错误会阻止程序的编译导致无法生成可执行程序。我们需要一种方法既能在编译期产生可用的日志，与此同时也不能阻碍程序的正常编译。于是我们想到，如果能将错误信息转换为警告信息不久好了么！在YAMPL中，打印类型信息的方法就是用这种思路实现的。

``` c++
#if defined(__clang__)
template <class T>
struct dbg_print_type {
  const int tmp = 1 / (sizeof(T) - sizeof(T));
};
#elif defined(__GNUC__)
#pragma GCC diagnostic push
#pragma GCC diagnostic warning "-Wsign-compare"
template <class T>
struct dbg_print_type {
  enum { n = sizeof(T) > -1 };
};
#pragma GCC diagnostic pop
#elif defined(_MSC_VER)
#pragma warning(push, 3)
template <class T>
struct dbg_print_type {
  char tmp[0];
};
#pragma warning(pop)
#else
template <class T>
struct dbg_print_type {};
#endif
```

以上代码实现了一个类模板`dbg_print_type`，并且分别对MSVC、GCC和CLang做了支持。当编译期时MSVC时，使用了数组大小为0的技巧促使编译期发出警告；当编译器是CLang时，使用除数为0的方式让编译器发出警告；当编译器是GCC时，使用不同符号类型比较让编译器发出警告，值得注意的是这个警告需要手动开启。

将上面示例中的`err_print_type`修改为`dbg_print_type`：

``` c++
dbg_print_type<typename minus<int_<10>, int_<2>>::type>();
```

GCC会发出这样的警告：

```
In instantiation of 'struct yampl::DbgPrintType<yampl::integral_const<int, 8> >':
required from here
warning: comparison of integer expressions of different signedness: 'long long unsigned int' and 'int' [-Wsign-compare]
   15 |   enum { n = sizeof(T) > -1 };
```

MSVC显示的警告为：

```
warning C4200: nonstandard extension used: zero-sized array in struct/union
message : This member will be ignored by a defaulted constructor or copy/move assignment operator
message : see reference to class template instantiation 'yampl::DbgPrintType<yampl::integral_const<T,8>>' being compiled
with
[
    T=int
]
```

请注意警告的信息确实比较多，但是仔细观察还是能看到`'struct yampl::DbgPrintType<yampl::integral_const<int, 8> >'`这样类似的信息。另外值得高兴的是，这些警告信息也确实没有阻止程序的编译。
