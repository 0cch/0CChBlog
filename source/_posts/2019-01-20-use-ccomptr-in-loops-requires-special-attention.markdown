---
author: admin
comments: true
layout: post
slug: 'use ccomptr in loops requires special attention'
title: 在循环中使用CComPtr需要特别注意
date: 2019-01-20 21:57:37
categories:
- Tips
---
CComPtr是ATL里提供给我们管理COM接口的智能指针类，使用它能够让我们无需关心接口的引用释放。例如：
``` c++
CComPtr<IShellFolder> pDesktop;
SHGetDesktopFolder(&pDesktop);
```
但是这个类在循环中使用的时候要特别注意一下，例如：
``` c++
// 没有问题
for (...) {
    CComPtr<IShellFolder> pDesktop;
    SHGetDesktopFolder(&pDesktop);
}

// 有问题，接口没有调用Release，内存泄露
CComPtr<IShellFolder> pDesktop;
for (...) {
    SHGetDesktopFolder(&pDesktop);
}
```
其根本原因是，CComPtr的&操作符重载的时候没有做释放操作，只有Debug版本的assert来提醒程序员这样使用的问题。
``` c++
T** operator&() throw()
{
	ATLASSERT(p==NULL);
	return &p;
}
```
所以我们需要手动调用Release
``` c++
CComPtr<IShellFolder> pDesktop;
for (...) {
    SHGetDesktopFolder(&pDesktop);
    ......
    pDesktop.Release();
}
```
注意，这里是调用CComPtr的Release成员函数，而不是其保护的接口对象的Release函数。

另外一个解决方案就是使用<comdef.h>里的_com_ptr_t，这个类对于上述情况做了更加合理的处理。
``` c++
Interface** operator&() throw()
{
	_Release();
	m_pInterface = NULL;
	return &m_pInterface;
}
```
可以看到这个类里，重载&操作符的函数会先调用Release，然后再取地址避免了内存泄漏的问题。