---
author: admin
comments: true
layout: post
slug: 'dont use getfullpathname'
title: 不要使用GetFullPathName获得相对路径的全路径
date: 2018-10-27 22:01:13
categories:
- Tips
---

上周末在网上闲逛，看到一篇介绍Path*相关API的文章，发现文章中推荐了GetFullPathName这个API，因为他能方便的获得相对路径对于当前工作目录的全路径。然而，我对于这个推荐API是坚决反对的。如果所有工程代码都是一个人开发，这种情况下调用这个API，我认为尚可理解，但是如果对于多人维护的大型工程，就不要使用它了。原因很简单，这个API是根据当前工作目录去确定绝对路径的，然而你无法确定当前工作目录是否是你认为的工作目录。即使在调用GetFullPathName之前，检查了这个路径，我认为也是不可信的。因为在检查过后，也有可能在其他线程中改变当前工作目录，要知道这个变量是全局唯一的。  

所以，以下代码是不可取的：
{% codeblock lang:cpp %}
WCHAR lpBuffer[MAX_PATH];
LPWSTR lpFname = NULL;

SetCurrentDirectoryW(L"C:\\some\\thing\\dir");
GetFullPathNameW(L"..\\other\\dir", MAX_PATH, lpBuffer, &lpFname);
{% endcodeblock %}

其实微软为我们提供挺好的API来代替他，比如PathCanonicalize以及PathCombine（实际上有更安全的API，比如 PathCchCanonicalize和PathCchCombine，只不过需要高版本的系统）。

所以，以下代码是正确的：

{% codeblock lang:cpp %}
WCHAR lpBuffer[MAX_PATH];
WCHAR lpSrc[MAX_PATH] = L"C:\\some\\thing\\dir";
wcscat_s(lpSrc, L"..\\other\\dir");
PathCanonicalizeW(lpBuffer, lpSrc);
{% endcodeblock %}

{% codeblock lang:cpp %}
WCHAR lpBuffer[MAX_PATH];
PathCombineW(lpBuffer, L"C:\\some\\thing\\dir", L"..\\other\\dir");
{% endcodeblock %}

最后在介绍一个实用的函数：PathCompactPath，这个函数把路径缩写为指定的像素长度：
{% codeblock lang:cpp %}
WCHAR buffer[MAX_PATH] = L"C:\\some\\thing\\very\\long\\long\\long\\long\\long\\path";
PathCompactPathW(NULL, buffer, 200);

// buffer="C:\some\thing\very...\path"
{% endcodeblock %}