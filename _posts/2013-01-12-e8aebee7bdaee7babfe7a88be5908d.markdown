---
author: admin
comments: true
date: 2013-01-12 07:04:10+00:00
layout: post
slug: '%e8%ae%be%e7%bd%ae%e7%ba%bf%e7%a8%8b%e5%90%8d'
title: 设置线程名
wordpress_id: 109
categories:
- Tips
---

给线程命名的作用主要还是为了调试方便。其他的好处也没有了，至少我没想出来。这里说一下MS_VC_EXCEPTION这个异常，调试器（vs，windbg）默认情况下应该会在收到这个异常的时候，他会自动处理这个异常，具体操作应该是记录下线程对应的名称，然后将异常设置为Handle状态。什么意思呢？就是说，即使下面这段代码中的RaiseException不在try-except中，在调试器attach的情况下也能顺畅执行，调试器不会因为异常把执行中断下了，而是默默设置了线程名之后继续后面的代码。而下面的代码之所以要放在try-except中，是因为希望没有调试器的情况下，也能顺利执行不被中断。另外一点，windbg可以设置让这个异常中断下来（命令 sxe vcpp），而vs貌似没有这样的方法，可能是我vs调试器用的比较少，没找到吧。对于托管代码，设置这个就更简单了，详见 [http://msdn.microsoft.com/en-us/library/581hfskb(v=vs.100).aspx](http://msdn.microsoft.com/en-us/library/581hfskb(v=vs.100).aspx)

[![](/uploads/2013/01/QQ截图20130112151544.png)](/uploads/2013/01/QQ截图20130112151544.png)


{% highlight cpp %}

#include 
const DWORD MS_VC_EXCEPTION=0x406D1388;

#pragma pack(push,8)
typedef struct tagTHREADNAME_INFO
{
    DWORD dwType; // Must be 0x1000.
    LPCSTR szName; // Pointer to name (in user addr space).
    DWORD dwThreadID; // Thread ID (-1=caller thread).
    DWORD dwFlags; // Reserved for future use, must be zero.
} THREADNAME_INFO;
#pragma pack(pop)

void SetThreadName( DWORD dwThreadID, char* threadName)
{
    THREADNAME_INFO info;
    info.dwType = 0x1000;
    info.szName = threadName;
    info.dwThreadID = dwThreadID;
    info.dwFlags = 0;

    __try
    {
        RaiseException( MS_VC_EXCEPTION, 0, sizeof(info)/sizeof(ULONG_PTR), (ULONG_PTR*)&info; );
    }
    __except(EXCEPTION_EXECUTE_HANDLER)
    {
    }
}
 {% endhighlight %}
