---
author: admin
comments: true
layout: post
slug: 'intro 3 cpp online tools'
title: C++在线工具
date: 2021-03-20 16:15:53
categories:
- CPP
---

这篇博客打算介绍4个C++在线工具，当手头没有设备或者没有开发环境的时候可以用它们做一些研究性质的工作。

1. https://wandbox.org/

   该网站可以在线编辑以及编译C++源代码并且运行编译后的程序。在C++类别它支持GCC和CLANG，另外除了C++，C、C#、Java、GO等等都有支持。

2. https://quick-bench.com/

   这也是一个可以在线编辑以及编译C++源代码并且运行编译后的程序的网站，但是与上面网站不同的是它运行程序并非用来输出结果，而是对函数做基准检测，采用的是Google Benchmark。同样它支持GCC和CLANG。

3. https://godbolt.org/

   这是我很喜欢的一个网站，它可以在线编辑和编译C++源代码，但是不可以运行程序。但是这并不能掩盖其优秀的地方，它支持C++各种编译器的各种版本，跨度非常大也非常全面。同时还可以自由设置编译器的编译参数并且查看输出的中间文件，对于研究C++编译过程十分有用。

4. https://cppinsights.io/

   这是一个非常有趣的网站，它能够将源代码展开，使用一种容易理解的方式展示编译器做了哪些自动化工作。用它自己的话来说，就是从编译器的视角看到的源代码。例如：

   ``` c++
   #include <cstdio>
   int main()
   {
       const char arr[10]{2,4,6,8};
       for(const char& c : arr)
       {
         printf("c=%c\n", c);
       }
   }
   ```

   会被网站展开为：

   ``` c++
   int main()
   {
     const char arr[10] = {2, 4, 6, 8, '\0', '\0', '\0', '\0', '\0', '\0'};
     {
       char const (&__range1)[10] = arr;
       const char * __begin1 = __range1;
       const char * __end1 = __range1 + 10L;
       for(; __begin1 != __end1; ++__begin1) 
       {
         const char & c = *__begin1;
         printf("c=%c\n", static_cast<int>(c));
       }
     }
   }
   ```

   