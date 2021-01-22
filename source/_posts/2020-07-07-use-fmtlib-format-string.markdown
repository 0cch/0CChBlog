---
author: admin
comments: true
layout: post
slug: 'use fmtlib format string'
title: 使用fmtlib格式化字符串
date: 2020-07-07 12:21:13
categories:
- CPP
---

在C++中格式化字符串的方法一直是一个备受争议的话题，无论是`printf`系列函数还是Stream IO都有各自的优缺点。本篇文章直接略过这两种方法，将目光放到fmtlib这个第三方库中，虽然是第三方库，但是C++20标准会引入该库的一部分特性。

fmtlib格式化字符串的语法和python十分相似，熟悉python的朋友掌握起来会非常迅速，例如：

``` python
"{} {}".format("hello", "world") 
```

以上是python格式化字符串的方法，对比到fmtlib为：

``` c++
#include <iostream>
#include <fmt/core.h>

int main()
{
	std::cout << fmt::format("{} {}", "hello", "world");
}
```

在python中，格式化字符串的{}是可以设定索引并且指定顺序的，例如：

``` python
"{1} {0} {1}".format("hello", "world")
```

在fmtlib中也能够实现：

``` c++
#include <iostream>
#include <fmt/core.h>

int main()
{
	std::cout << fmt::format("{1} {0} {1}", "hello", "world");
}
```

另外在python中还可以使用命名的{}来格式化字符串：

``` python
"{first} {second}".format(first = "hello", second = "world")
```

不过C++中不支持指定参数名来传参，fmtlib采用了一个很巧妙的方法，它使用了自定义字面量的方法生成了一个named_arg对象：

``` c++
#include <iostream>
#include <fmt/core.h>
#include <fmt/format.h>

int main()
{
	using namespace fmt::literals;
	std::cout << fmt::format(
		"{first} {second}", 
		"first"_a = "hello", "second"_a = "world");
}
```

格式化说明符的语法也是基本相同的：

``` python
"{:.2f}".format(3.1415926)
```

对应到fmtlib：

``` c++
#include <iostream>
#include <fmt/core.h>

int main()
{
	std::cout << fmt::format("{:.2f}", 3.1415926);
}
```

详细的格式化说明符的文档见：[链接](https://fmt.dev/latest/syntax.html)

最后fmtlib还支持自定义格式化类型，例如：

``` c++
#include <iostream>
#include <fmt/core.h>

struct PersonInfo
{
	char name[16];
	int age;
	char telephone[16];
};

template<> struct fmt::formatter<PersonInfo> {

	constexpr fmt::format_parse_context::iterator 
	parse(fmt::format_parse_context& ctx) {
		auto iter = ctx.begin();
		return ++iter;
	}

	fmt::format_context::iterator 
	format(PersonInfo info, fmt::format_context& ctx) {
		return fmt::format_to(ctx.out(), 
		"name : {} | age : {} | tel. : {}", 
		info.name, info.age, info.telephone);
	}
};

int main()
{
	PersonInfo info{ "xiaoming", 18, "1234567890" };
	std::cout << fmt::format("{}", info);
}
```