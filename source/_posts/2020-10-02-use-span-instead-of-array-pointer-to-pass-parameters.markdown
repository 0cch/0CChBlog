---
author: admin
comments: true
layout: post
slug: 'use std::span instead of array pointer to pass parameters'
title: 使用std::span代替数组指针传参
date: 2020-10-02 15:52:31
categories:
- CPP
---

我们知道`std::string_view`可以创建`std::string`的一个视图，视图本身并不拥有实例，它只是保持视图映射的状态。在不修改实例的情况下，使用`std::string_view`会让字符串处理的性能大幅提升。实际上，对于那些连续的序列对象我们都可以创建这样一份视图，对于`std::vector`这样的对象可以提高某些操作中的性能，另外对原生数组可以提高其访问的安全性。

过去如果一个函数想接受无法确定数组长度的数组作为参数，那么一定需要声明两个参数：数组指针和长度：

``` c++
void set_data(int *arr, int len) {}

int main()
{
	int buf[128]{ 0 };
	set_data(buf, 128);
}
```

这种人工输入增加了编码的风险，数组长度的错误输入会引发程序的未定义行为，甚至是成为可被利用的漏洞。C++20标准库为我们提供了一个很好解决方案`std::span`，通过它可以定义一个基于连续序列对象的视图，包括原生数组，并且保留连续序列对象的大小。例如：

``` c++
#include <iostream>
#include <span>
void set_data(std::span<int> arr) {
	std::cout << arr.size();
}

int main()
{
	int buf[128]{ 0 };
	set_data(buf);
}
```

除了原生数组，`std::vector`和`std::array`也在`std::span`的处理之列：

``` c++
std::vector<int> buf1{ 1,2,3 };
std::array<int, 3> buf2{ 1, 2, 3 };
set_data(buf1);
set_data(buf2);
```

值得注意的是，`std::span`还可以通过构造函数设置连续序列对象的长度：

``` c++
int buf[128]{ 0 };
set_data({ buf, 16 });
```

从`std::string_view`到`std::span`，我们可以看出C++标准库很乐于这种视图设计，因为这种设计和抽象的实现可以提高C ++程序的可靠性而又不牺牲性能和可移植性。

