---
author: admin
comments: true
date: 2014-04-05 02:49:44+00:00
layout: post
slug: global-logger%e6%89%93%e5%bc%80%e5%bc%80%e6%9c%ba%e5%90%af%e5%8a%a8etw%e6%97%a5%e5%bf%97
title: Global Logger打开开机启动ETW日志
wordpress_id: 422
categories:
- Tips
---

在我看来XP确实应该寿终正寝了，因为确实在很多机制方面不如新的系统，比如ETW。而微软的XPERF也没有能在XP上直接安装的。当然，老版本的XPERF还能在XP上运行，只是监控能力有限，到了新版本的XPERF，在XP上就运行不了了。但是，XP却在中国还活的好好的，所以优化其性能必不可少。于是，在没有XPERF支持的情况下，要做到开启ETW日志，我们就需要微软提供的Global Logger机制，打开开机启动的Trace Session。

微软对打开Global Logger的方法做了详细的说明：[http://msdn.microsoft.com/en-us/library/windows/hardware/ff546686(v=vs.85).aspx ](http://msdn.microsoft.com/en-us/library/windows/hardware/ff546686(v=vs.85).aspx )，我这里没必要再赘述了，只有一个地方需要注意，要说明一下**EnableKernelFlags**这个变量，他是一个REG_BINARY类型，他的值是EVENT_TRACE_PROPERTIES的EnableFlags。但是EnableFlags是一个DWORD，而**EnableKernelFlags**是一个32字节的数组。如果你设置的时候，只是设置了一个DWORD，那么你会发现ETW 日志不会开启。

话说到这，**EnableKernelFlags**中前4字节的DWORD是EVENT_TRACE_PROPERTIES的组合，那么后面还有28字节是干什么的呢？实际上ETW能记录的标志还有很多，只是没有在EVENT_TRACE_PROPERTIES中说明，他们都被分到8个分组里面去了，这也是为什么有32个字节的Flags。具体怎么分组，还有哪些标志位，可以参考WRK的代码。

我这里写了个小工具可以用来设置Global Flags，不过如果你能找到XP上可以用的XPERF当然是最好的选择了！

[![20140405104746](/uploads/2014/04/20140405104746.png)](/uploads/2014/04/20140405104746.png)



下载:[GlobalLog](/uploads/2014/04/GlobalLog.zip)
