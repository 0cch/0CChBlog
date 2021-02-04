---
author: admin
comments: true
layout: post
slug: 'parallel algorithm in STL'
title: STL中并行算法
date: 2021-04-05 11:04:49
categories:
- CPP
---

C++17标准的一个重大突破是让标准库中的部分算法支持了并行计算，这对于无处不在的多线程环境来说无疑是一个非常不错的消息。具体支持并行计算的算法可以参考提案文档[p0024r2](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0024r2.html#algorithms.parallel.overloads)。

接下来将会选取两个典型算法函数对STL的并行算法进行介绍：

``` c++
#include <vector>
#include <algorithm>
#include <execution>

int main()
{
	std::vector<int> coll;
	coll.reserve(10000);
	for (int i = 0; i < 10000; ++i) {
		coll.push_back(i);
	}

	std::for_each(std::execution::par,
		coll.begin(), coll.end(),
		[](auto& val) {
			val *= val;
		});
}
```

以上是一个最简单的并行计算例子，例子中使用了`for_each`函数，该函数并不是新加入到标准库的。只不过现在多了一个并行计算的版本，其中第一个参数是并行计算的策略。实际上，大部分并行计算的算法都是在原有算法的基础做了新增，它们的共同特点是第一个参数改为了并行计算策略，当然老的算法也依然存在。在这个例子中，策略`std::execution::par`是并行计算其中的一种策略。在这个策略中函数会使用多线程执行算法，并且线程在执行算法的单个步骤是不会被打断的。为了看清线程的执行情况，我们可以将线程id输出到控制台：

``` c++
#include <iostream>
#include <vector>
#include <algorithm>
#include <execution>
#include <thread>
int main()
{
	std::vector<int> coll;
	coll.reserve(10000);
	for (int i = 0; i < 10000; ++i) {
		coll.push_back(i);
	}

	std::for_each(std::execution::par,
		coll.begin(), coll.end(),
		[](auto& val) {
			std::cout << std::this_thread::get_id() << std::endl;
			val *= val;
		});
}
```

运行这份代码就会发现线程id交替输出到控制台上，可见确实是多线程执行`for_each`函数。让我们再看看排序函数`std::sort`：

``` c++
#include <iostream>
#include <vector>
#include <algorithm>
#include <execution>
#include <thread>
int main()
{
	std::vector<int> coll;
	coll.reserve(10000);
	for (int i = 0; i < 10000; ++i) {
		coll.push_back(i);
	}

	std::sort(std::execution::par,
		coll.begin(), coll.end(),
		[](const auto& val1, const auto& val2) {
			std::cout << std::this_thread::get_id() << std::endl;
			return val1 > val2;
		});
}
```

执行这份代码同样的会发现多个线程交替输出线程id到控制台上，实际上它们正在并行计算排续该容器。并行计算的优势在数据量足够大的时候是非常明显的，比如：

``` c++
#include <iostream>
#include <chrono>
#include <vector>
#include <algorithm>
#include <execution>

int main()
{
	std::vector<int> coll;
	coll.reserve(100000);
	for (int i = 0; i < 100000; ++i) {
		coll.push_back(i);
	}

	auto start = std::chrono::high_resolution_clock::now();
	std::sort(std::execution::par,
		coll.begin(), coll.end(),
		[](const auto& val1, const auto& val2) {
			return val1 > val2;
		});
	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> diff = end - start;
	std::cout << "elapsed time = " << diff.count();
}
```

逆向排序100000个数，使用并行算法在我的机器上消耗了0.48秒。如果删除第一个参数使用传统单线程排续，在我的机器上消耗0.89秒，并行计算性能提升近1倍。

最后来介绍一下C++17中的3种并行计算策略：

* `std::execution::seq` 该策略与非并行算法一样，当前执行线程逐个元素依次执行必要的操作。 使用该策略的行为类似于使用完全不接受任何执行策略的非并行调用算法的方式。

* `std::execution::par` 该策略会让多个线程执行元素的必要操作。 当算法开始执行必要的操作时，它会一直执行到操作结束，不会被打断。

* `std::execution::par_unseq` 该策略会让多个线程执行元素的必要操作，但是与`std::execution::par`不同的是，该策略不能保证一个线程执行完该元素的所有步骤而不被打断。在提案文档中也指出了错误示例：

  ``` c++
  int x = 0;
  std::mutex m;
  int a[] = {1,2};
  std::for_each(std::execution::par_unseq, 
                std::begin(a), std::end(a), [&](int) {
    std::lock_guard<mutex> guard(m); // Error: lock_guard constructor calls m.lock()
    ++x;
  });
  ```

  这里由于`std::execution::par_unseq` 无法保证执行lambda表达式的时候不被打断，可能会造成同一个线程两次次进入lambda表达式，并且调用`m.lock()`导致死锁。

