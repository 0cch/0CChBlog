---
author: admin
comments: true
layout: post
slug: 'use std::any instead of std::shared_ptr <void> and void *'
title: 使用std::any代替std::shared_ptr<void>和void *
date: 2021-01-03 12:30:07
categories:
- CPP
---

大家在编写程序的时候应该遇到过这样一个场景，该场景需要传递某种数据，但是数据类型和数据大小并不确定，这种时候我们常用`void *`类型的变量来保存对象指针。例如：

``` c++
struct SomeData { 
  // ... 
  void* user_data; 
};
```

上面的结构体只是一个示例，代表有的数据是用户产生的。当用户数据是一个字符串时，可能的代码是：

``` c++
SomeData sd{};
sd.user_data = new std::string{ "hello world" };
```

另外，使用`void*`存储数据需要了解数据类型，并且需要自己维护数据的生命周期：

``` c++
std::string *str = static_cast<std::string *>(sd.user_data);
delete str;
str = nullptr;
```

使用`std::shared_ptr<void>`可以解决生命周期的问题：

``` c++
struct SomeData {
	// ... 
	std::shared_ptr<void> user_data;
};

SomeData sd{};
sd.user_data = std::make_shared<std::string>("hello world");

auto ud = std::static_pointer_cast<std::string>(sd.user_data);
```

虽然`std::shared_ptr<void>`可以用于管理生命周期，但是类型安全的问题却无法解决。比如当`user_data`销毁时，由于缺乏类型信息会导致对象无法正确析构。

为了解决以上这些问题，C++17标准库引入`std::any`。顾名思义就是可以存储任意类型，我们可以将其理解为带有类型信息的`void*`。例如：

``` c++
struct any {
 void* object;
 type_info tinfo;
};
```

当然，`std::any`的实现比这个要复杂的多，我们后面再讨论类型是如何被记录下来的。先来看看`std::any`的用法：

``` c++
#include <iostream>
#include <string>
#include <any>

int main()
{
	std::any a;
	a = std::string{ "hello world" };
	auto str = std::any_cast<std::string>(a);
	std::cout << str;
}
```

除了转换为对象本身，还可以转换为引用：

``` c++
auto& str1 = std::any_cast<std::string&>(a);
auto& str2 = std::any_cast<const std::string&>(a);
```

当转换类型不正确时，`std::any_cast`会抛出异常`std::bad_any_cast`：

``` c++
try {
	std::cout << std::any_cast<double>(a) << "\n";
}
catch (const std::bad_any_cast&) {
	std::cout << "Wrong Type!";
}
```

如果转换的不是对象而是对象指针，那么`std::any_cast`不会抛出异常，而是返回空指针

``` c++
auto* ptr = std::any_cast<std::string>(&a);
if(ptr) {
 std::cout << *ptr;
} else {
 std::cout << "Wrong Type!";
}
```

请注意，使用`std::any_cast`转换类型必须和`std::any`对象的存储类型完全一致，否则同样会抛出异常，即使两者是继承关系。原因很简单，`std::any_cast`是直接使用`type_info`作比较：

``` c++
const type_info* const _Info = _TypeInfo();
if (!_Info || *_Info != typeid(_Decayed)) {
    return nullptr;
}
```

最后简单描述一下`std::any`保证类型安全的原理：

首先是类型转换，刚刚已经提到了，`std::any`会记录对象的`type_info`，`std::any_cast`使用`type_info`作比较，只有完全一致才能进行转换。

其次为了保证类型正确的拷贝，移动以及生命周期结束时能够正确析构，在创建`std::any`对象时生成一些函数模板实例，这些函数模板调用了类型的拷贝，移动以及析构函数。`std::any`只需要记录这些函数模板实例的指针即可。拿析构简单举例：

``` c++
template <class T>
void destroy_impl(void* const p)
{
	delete static_cast<T*>(p);
}

using destory_ptr = void (*)(void* const);

struct AnyMetadata {
	destory_ptr func;
    ...
};

template<class T>
void create_anymeta(AnyMetadata &meta)
{
	meta.func = destroy_impl<T>;
}

// any构造时知道目标对象类型，此时可以保存函数指针
AnyMetadata metadata;
create_anymeta<std::string>(metadata);

// any销毁时调用
metadata.func(obj);
```



