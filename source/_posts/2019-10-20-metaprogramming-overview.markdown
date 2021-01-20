---
author: admin
comments: true
layout: post
slug: 'metaprogramming overview'
title: 初探C++模板元编程
date: 2019-10-20 20:38:15
categories:
- CPP
---

C++模板元编程，通常来说是指利用模板控制编译器产生临时源代码的技术。该临时源代码可以和以后代码共同编译为可执行程序。由于模板元编程控制的是编译器，所以这个过程是在编译期进行，对于代码运行期的状态没有影响。

使用C++模板元编程编写的程序我们可以称之为模板元程序，最简单的模板元程序我们可以写成这样：

``` c++
#include <iostream>
#include <type_traits>
int main() {
  using mytype = int;
  std::cout << "std::is_same<mytype, int>::value = "
            << std::is_same<mytype, int>::value << std::endl;
  return 0;
}
```

在上面的代码中`std::is_same<mytype, int>::value`是典型的模板元程序代码，编译器会在编译期对这句代码进行计算，最终产生以下临时代码：

``` c++
std::cout << "std::is_same<mytype, int>::value = "
            << 1 << std::endl;
```

进一步可以看出，由于`std::is_same<mytype, int>::value`在编译期已经得出结果，所以它并不会对程序的运行产生任何副作用。

解释到这里，我想读者应该对C++模板元编程和模板元程序有了一个大概的理解。实际上，在我刚刚接触到模板元程序的时候，最疑惑的问题就是它为什么叫做元程序（metaprogram）。经过一番研究后发现，meta起源于希腊语，有after和beyond的含义，作为前缀通常用于表达更高抽象水平的描述。比如在解释数据库元数据（MetaData）时，我们说它是定义数据的数据。而联想到元程序，同样也可以理解为定义程序的程序。熟悉编写编译器的读者应该会接触到flex和bison（或者lex和yacc）。它们是一对词法和语法的解析器生成器，我们可以通过定义词法和语法规则让它们生成出相当完善的词法和语法的解析器源代码，所以flex和bison就是一对最典型的元程序。

## 最早的C++模板元程序

1994年Erwin Unruh在C++委员会上提交了下面这份代码：

``` c++
// Prime number computation by Erwin Unruh
template <int i> struct D { D(void*); operator int(); };

template <int p, int i> struct is_prime {
    enum { prim = (p%i) && is_prime<(i > 2 ? p : 0), i -1> :: prim };
    };

template < int i > struct Prime_print {
    Prime_print<i-1> a;
    enum { prim = is_prime<i, i-1>::prim };
    void f() { D<i> d = prim; }
    };

struct is_prime<0,0> { enum {prim=1}; };
struct is_prime<0,1> { enum {prim=1}; };
struct Prime_print<2> { enum {prim = 1}; void f() { D<2> d = prim; } };
#ifndef LAST
#define LAST 10
#endif
main () {
    Prime_print<LAST> a;
    }
```

从类模板命名上看，它似乎是一份打印质数的代码。但是请注意，这份代码在现在看来并不符合当前C++的语法规范，所以是无法通过编译的。实际上，当时Erwin Unruh使用的是一款叫做Metaware Compiler的编译器编译的上述代码，虽然仍然无法通过编译，但是却能输出一些有趣的信息：

```
MetaWare High C/C++ Compiler R2.6
(c) Copyright 1987-94, MetaWare Incorporated
E "primes.cpp",L16/C63(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<2>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<3>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<5>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<7>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<11>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<13>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<17>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<19>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<23>´ ("primes.cpp",L2/C25).
-- Detected during instantiation of Prime_print<30> at "primes.cpp",L21/C5:
E "primes.cpp",L11/C25(#416):   prim
|    Type `enum{}´ can´t be converted to txpe `D<29>´ ("primes.cpp",L2/C25).
```

观察上面这份编译器输出的错误信息，我们发现每条错误信息都给出了一个质数，例如`D<2>`、`D<3>`、`D<4>`等等，这说明编译器在编译阶段已经开始了对模板的计算。在1994年之后，Erwin Unruh发现上述代码已经不能被新语法所支持，所以在2002年发布了新代码：

``` c++
// Prime number computation by Erwin Unruh

template <int i> struct D { D(void*); operator int(); };

template <int p, int i> struct is_prime {
 enum { prim = (p==2) || (p%i) && is_prime<(i>2?p:0), i-1> :: prim };
};

template <int i> struct Prime_print {
 Prime_print<i-1> a;
 enum { prim = is_prime<i, i-1>::prim };
 void f() { D<i> d = prim ? 1 : 0; a.f();}
};

template<> struct is_prime<0,0> { enum {prim=1}; };
template<> struct is_prime<0,1> { enum {prim=1}; };

template<> struct Prime_print<1> {
 enum {prim=0};
 void f() { D<1> d = prim ? 1 : 0; };
};

#ifndef LAST
#define LAST 18
#endif

main() {
 Prime_print<LAST> a;
 a.f();
}
```

这份代码可以用较老版本的GCC编译，比如GCC 4.1，同样的它会让编译器计算并打印出关于质数的错误信息（由于错误信息过多影响阅读，所以这里省略了无用部分，想看完整错误信息的读者可以自己尝试编译上述代码。）：

```
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 17]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 13]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 11]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 7]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 5]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 3]'
...
<source>:12: error:   initializing argument 1 of 'D<i>::D(void*) [with int i = 2]'
```

虽然这份代码可以使用GCC编译，不过有些遗憾的是，它依然无法编译成功。为了弥补这个缺憾，我再次对这份代码进行了修改，修改的目的有两个：

1. 使用现代C++语法；
2. 消除错误信息，让代码能够顺利的编译。

``` c++
template <int... args>
struct prime_values {
  static const int size = sizeof...(args);
};

template <class T, T t, class U, template <T...> class R>
struct add_to {};

template <class T, T t, template <T...> class U, template <T...> class R,
          T... args>
struct add_to<T, t, U<args...>, R> {
  using result = R<t, args...>;
};

constexpr int is_prime2(int n) {
  for (int i = 2; i * i <= n; i++) {
    if (n % i == 0) {
      return 0;
    }
  }

  return 1;
}

template <int n, int>
struct prime_list {
  using result = typename prime_list<n - 1, is_prime2(n - 1)>::result;
};

template <int n>
struct prime_list<n, 1> {
  using result =
      typename add_to<int, n,
                      typename prime_list<n - 1, is_prime2(n - 1)>::result,
                      prime_values>::result;
};

template <>
struct prime_list<2, 1> {
  using result = prime_values<2>;
};

template <int n>
using get_prime_list_t = typename prime_list<n, n - 2>::result;

#ifndef LAST
#define LAST 18
#endif
#pragma GCC diagnostic push
#pragma GCC diagnostic warning "-Wsign-compare"
template <class T>
struct DbgPrintType {
  enum { n = sizeof(T) > -1 };
};

#define PRINT_TYPE(x) DbgPrintType<x>();
#define PRINT_VALUE_TYPE(x) DbgPrintType<decltype(x)>();
#pragma GCC diagnostic pop

int main() {
  get_prime_list_t<LAST> x;
  PRINT_VALUE_TYPE(x);
}
```

对于不熟悉模板元编程的读者来说，上面的代码可能不是很好理解。不过没关系，后面会详细介绍模板元编程的细节。现在我只是想让读者看到模板元编程的强大和有趣之处。

使用支持C++17标准的GCC可以成功编译以上代码并且输出以下警告信息：

```
test.cpp: In instantiation of 'struct DbgPrintType<prime_values<17, 13, 11, 7, 5, 3, 2> >':
test.cpp:62:3:   required from here
test.cpp:53:24: warning: comparison of integer expressions of different signedness: 'long long unsigned int' and 'int' [-Wsign-compare]
   53 |   enum { n = sizeof(T) > -1 };
      |              ~~~~~~~~~~^~~~
```

在这些警告信息中，我们可以清晰的看到一组倒序的质数序列`17, 13, 11, 7, 5, 3, 2`。值得注意的是，这条警告是我有意而为之的，目的是为了让编译器打印出质数序列。

事实上，从语法角度来说模板元编程是图灵完备（Turing Complete）的，也就是说理论上能够解决所有可计算的问题。不过有些遗憾的是，从编译器的角度来说模板元编程是图灵不完备的，因为作为循环的实现方法，递归在编译器中是有明确的深度限制的。

## 范型编程与C++模板元编程

泛型编程是一种编程风格，它允许程序员在强类型程序设计语言中编写代码时使用一些以后才指定的类型，并在实例化时作为参数指明这些类型。在C++语言中，实现范型编程的基础就是模板，换句话说模板也是为了让C++具有范型能力而设计的。

模板元编程则有些不同，正如我们在上文中看到的，它的出现更像是一个意外而并非有意设计。这也能解释模板元编程的语法为什么如此晦涩难懂。不过幸运的是，模板元编程除了晦涩难懂之外，还是带来了一些意外的惊喜。比如它可以为范型编程加入静态类型检查以及策略定制的能力。

## 接下来做什么

如果只是用C++模板元编程做数值计算，那么我敢肯定的说这种计算有90%是几乎没有意义的，因为使用运行期做数值计算往往是更好的方法。而真正让模板元编程具有价值的是它对类型的计算能力，通过类型计算能够让我们的代码更加通用且有更高的运行效率，当然代价是更加晦涩难懂的代码，更长的编译时间，以及更加复杂的错误信息。不过读者也不必担心这些代价，因为后续部分就是围绕着类型计算以及其相关问题展开的。

在后面的内容中，我们首先将接触到序列和元函数的概念以及它们的习惯用法。然后我们会使用序列和元函数完成基本的判断和循环操作。以上是模板元编程的基础部分，在此之后我们将实现一套轻量级的模板元编程库YAMPL（Yet Another MPL），YAMPL在接口上将非常接近Boost的MPL。请注意，实现YAMPL的目的并不是取代MPL，而是让我们牢牢掌握模板元编程的一种手段。

事实上，无论什么时候，只要用到模板元编程，STL的type_traits和Boost的MPL这些成熟的模板元编程库都应该是优先考虑的对象。其中STL的type_traits专注于完成关于类型的一些基本操作，它是模板元编程的基础设施，是一个正规模板元编程程序库必不可少的组成部分。而Boost的MPL则是一个强大的模板元编程框架，它构建于Boost的type_traits的基础之上，并且提供一套强大且连贯的工具集，这些工具能让C++模板元编程变得简单有趣。