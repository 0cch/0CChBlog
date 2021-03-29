---
author: admin
comments: true
layout: post
slug: 'the working principle of qlist'
title: QList 的工作原理和运行效率浅析
date: 2021-05-29 17:34:16
categories:
- CPP
---

我们知道Qt为了在一些没有STL的环境中运作，开发了一套相对完整的容器。大部分Qt的容器我们都能够招到对应STL容器，例如`QVector`对应`std::vector`, `QMap`对应`std::map`，不过这其中也有一些特例，例如`QList`在STL中就没有应该的容器，`std::list`对应的Qt容器实际上是`QLinkedList`。所以在使用`QList`的时候请务必弄清楚这一点，否则可能会导致程序的运行效率的低下，让我们先看一份代码：

``` c++
#include <benchmark/benchmark.h>
#include <qlist>
#include <qvector>

const std::string test_buffer{ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" };
const int ITER_COUNTS = 10000000;

static void BM_QListPushString(benchmark::State& state) {
	QList<std::string> test_qlist;
	for (auto _ : state) {
		test_qlist.push_back(test_buffer);
	}
}
BENCHMARK(BM_QListPushString)->Iterations(ITER_COUNTS);

static void BM_QVectorPushString(benchmark::State& state) {
	QVector<std::string> test_qvector;
	for (auto _ : state) {
		test_qvector.push_back(test_buffer);
	}
}
BENCHMARK(BM_QVectorPushString)->Iterations(ITER_COUNTS);

static void BM_QListPushChar(benchmark::State& state) {
	QList<char> test_qlist;
	for (auto _ : state) {
		test_qlist.push_back('x');
	}
}
BENCHMARK(BM_QListPushChar)->Iterations(ITER_COUNTS);

static void BM_QVectorPushChar(benchmark::State& state) {
	QVector<char> test_qvector;
	for (auto _ : state) {
		test_qvector.push_back('x');
	}
}
BENCHMARK(BM_QVectorPushChar)->Iterations(ITER_COUNTS);

BENCHMARK_MAIN();
```

以上代码使用google benchmark统计`QList`和`QVector`的运行效率，代码采用的最简单的`push_back`函数测试两种容器对于小数据和相对较大数据的处理性能。结果如下：

```
Run on (8 X 3600 MHz CPU s)
CPU Caches:
  L1 Data 32 KiB (x4)
  L1 Instruction 32 KiB (x4)
  L2 Unified 256 KiB (x4)
  L3 Unified 8192 KiB (x1)
-----------------------------------------------------------------------------------
Benchmark                                         Time             CPU   Iterations
-----------------------------------------------------------------------------------
BM_QListPushString/iterations:10000000          152 ns          150 ns     10000000
BM_QVectorPushString/iterations:10000000        102 ns          102 ns     10000000
BM_QListPushChar/iterations:10000000           12.2 ns         12.5 ns     10000000
BM_QVectorPushChar/iterations:10000000         4.92 ns         4.69 ns     10000000
```

可以发现`QVector`在两种情况下的性能都占优，尤其是`PushChar`的情况优势更加明显。原因就要从`QList`的原理说起了。前面说过`QList`并不是一个链表链接的结构，它的实际结构如下：

```
       QListData                                 +--------------------+
                                                 |                    |
+------------------------+                       |      obj buffer 1  |
|                        |                       |                    |
|      ptr to buffer 1   +----------------------->                    |
|                        |                       +--------------------+
+------------------------+
|                        |                       +--------------------+
|      ptr to buffer 2   |                       |                    |
|                        +----------------------->      obj buffer 2  |
+------------------------+                       |                    |
|                        |                       |                    |
|           .            |                       +--------------------+
|           .            |
|           .            |
|                        |
+------------------------+
|                        |                       +--------------------+
|                        |                       |                    |
|      ptr to buffer N   +----------------------->                    |
|                        |                       |      obj buffer N  |
+------------------------+                       |                    |
                                                 +--------------------+

```

它的内部维护了一个指针（void*）的数组，该数组指向了真正的对象，它就像是一个`vector`和`list`的结合体一样。在对象占用内存大的时候（大于`sizeof(void*)`），它每次会从堆中分配内存。然后将内存的起始地址放入数组中。相对于`QVector`慢的原因是它每次都要经过堆分配内存，而`QVector`可以预分配内存从而提高`push_back`的运行效率。而对于小内存对象，他直接将其存储到数组中，这样不需要经过堆分配内存，所以相对于大内存`QList`本身也有很大的性能提升，但是由于它每次需要用到`sizeof(void*)`的内存，也会导致更多的内存分配，所以运行效率还是不如`QVector`。

当然，`QList`也有自己的优势，例如当对占用大内存对象进行重新排续的时候，`QVector`只能进行大量内存移动，而`QList`则只需要移动对象指针即可。相对于`std::list`，`QList`在单纯的`push_back`和枚举的时候也有不错的表现。