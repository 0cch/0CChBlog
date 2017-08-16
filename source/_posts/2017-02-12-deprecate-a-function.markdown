---
author: admin
comments: true
date: 2017-02-12 10:41:34+00:00
layout: post
slug: 'deprecate a function'
title: 让编译器不推荐(deprecate)使用一个函数
categories:
- Tips
---

在开发一些公共库函数的时候，我们常常会对函数进行改写，这个时候我们会希望使用者用新的函数。为了提醒使用者，我们可以通过将函数声明为deprecated，这样编译器在编译的时候会抛出一个C4995或者C4996的警告。这个警告我们应该也经常看到过，比如使用strcpy，编译器会提示我们使用strcpy_s。  

使用这个编译器特性有两种方法：  
1. __declspec(deprecated)
2. #pragma deprecated

* __declspec(deprecated)  
[https://msdn.microsoft.com/en-us/library/044swk7y.aspx](https://msdn.microsoft.com/en-us/library/044swk7y.aspx)  
这种方法直接声明在函数或者类之前，在使用函数的地方会抛出C4996的警告  
```
__declspec(deprecated) void func1(int) {}  
```
当然我们还可以给警告自定义消息信息  
```
__declspec(deprecated("** this is a deprecated function **")) void func2(int) {}  
```


* #pragma deprecated  
[https://msdn.microsoft.com/en-us/library/c8xdzzhh.aspx](https://msdn.microsoft.com/en-us/library/c8xdzzhh.aspx)  
这种方法可以一次性声明多个函数或者类，使用函数的地方会抛出C4995的警告  
```
#pragma deprecated(func1, func2)  
```

