---
author: admin
comments: true
layout: post
slug: 'use std::sample to get random samples'
title: 使用std::sample获取随机样本
date: 2020-12-26 10:16:36
categories:
- CPP
---

C++17标准库提供了一个`std::sample`函数模板用于获取随机样本，该样本是输入全体样本的一个子集。具体例子如下：

``` c++
#include <iostream>
#include <vector>
#include <iterator>
#include <algorithm>
#include <random>
int main()
{
	std::vector<int> data;
	for (int i = 0; i < 10000; ++i) {
		data.push_back(i);
	}

	std::sample(data.begin(), 
        data.end(),
		std::ostream_iterator<int>{std::cout, "\n"},
		10,
		std::default_random_engine{});
}
```

可以看到`std::sample`需要5个参数，其中前2个参数是全体样本的合计的`begin`和`end`迭代器，它定义了全体样本的范围。第3个参数则是输出迭代器，第4个参数是需要样本的数量，最后是随机数引擎。注意这里`std::default_random_engine`没有设置`seed`，这必然导致每次运行获取的样本相同。

以上代码的输出结果为：

```
0
488
963
1994
2540
2709
2835
3518
5172
7996
```

我们可以为随机数引擎设置`seed`：

``` c++
std::random_device rd;
std::default_random_engine eng{ rd() };
std::sample(data.begin(), 
	data.end(),
	std::ostream_iterator<int>{std::cout, "\n"},
	10,
	eng);
```

这样每次样本就会发生变化。另外`std::sample`是有返回值的，返回的是最后一个随机样本之后的迭代器。它的作用是确定随机样本在输出容器中的范围，例如：

``` c++
#include <iostream>
#include <vector>
#include <iterator>
#include <algorithm>
#include <random>
int main()
{
	std::vector<int> data;
	for (int i = 0; i < 10000; ++i) {
		data.push_back(i);
	}

	std::vector<int> out_data;
	out_data.resize(100);
	std::random_device rd;
	std::default_random_engine eng{ rd() };
	auto end = std::sample(data.begin(), 
		data.end(),
		out_data.begin(),
		10,
		eng);

	std::cout << "coll size: " 
		<< out_data.size() 
		<< std::endl;
	for (auto it = out_data.begin(); it != end; ++it) {
		std::cout << *it << std::endl;
	}
}
```

以上代码的输出结果为：

``` c++
coll size: 100
1708
1830
2803
3708
5146
7376
7867
8059
8271
9448
```

可以看到，虽然容器的大小是100，但是我们只填充10个随机样本。最后需要说明一下`std::sample`对于两个迭代器参数的要求，首先源迭代器至少是一个输入迭代器的时候，目标迭代器至少可以是一个输出迭代器。但是当源迭代器不是一个向前迭代器，那么目标迭代器必须是一个随机迭代器。这一点很好理解，当源迭代器不能确保随机的情况下，只能将目的迭代器随机以确保样本的随机性。

