---
author: admin
comments: true
layout: post
slug: 'yield-in-cpp'
title: C++20增加的生成器特性
date: 2017-10-23 15:00:50
categories:
- Tips
---

不得不说，C++的语法真是越来越高级了，编译器为程序做的事情也是越来越多了。
比方说下面的这个程序，有两个点可以说说：
1. 生成器 —— 编译器为了实现生成器，不得不把这一个函数拆成两个部分，分为初始化部分和程序运行部分。初始化部分主要用来初始保存生成器运行状态的内存空间。每当co_yield返回后，这片内存空间需要保持当前变量的值，以方便程序再次进入生成器后继续运行。

2. 异步 —— 在新的标准里，我们实现异步的编码成本更低了。编译器同样为我们做了大量工作，这个例子中，主线程执行到subfuc函数的co_await后，会启动两个线程，一个执行异步函数awaitfuc，另外一个等待这个函数结束执行后面的代码，而主线程本身则是跳出函数执行printf函数。没错，我们简简单单的一句话就让编译器生成了这么多代码。

{% codeblock lang:cpp %}
#include <experimental/generator>
#include <future>
#include <windows.h>
using namespace std::experimental;

generator<int> foo()
{
	int p = 1;
	int q = 2;
	for (int j = 0; j < 10; j++) {
		for (int i = 0; i < 10; i++) {
			co_yield i + p;
		}
	}
	
	int pp = 3;
}

std::future<int> awaitfuc()
{
	Sleep(5000);
	co_return 100;
}

std::future<int> subfuc()
{
	auto p = co_await std::async(awaitfuc);
	printf("return 100\n", p.get());
	for (int i : foo()) {
		printf("%d ", i);
	}
	
	co_return 0;
}

int main()
{
	subfuc();
	printf("hello\n");
	Sleep(100000);
	return 0;
}

{% endcodeblock %}