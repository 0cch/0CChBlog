---
author: admin
comments: true
date: 2016-07-24 11:27:25+00:00
layout: post
slug: 'something-about-windows-timer-resolution'
title: 关于Windows Timer精确度
categories:
- Tips
---

Windows Timer相比大家都用过，WM_TIMER, WM_SYSTIMER, Waitable Timer, Multimedia Timer, Timer Queue Timer，这么多种Timer，给我们变成提供了很大的方便，有窗口无窗口都能自如选择。所以尽量也不要自己再造轮子，用什么Sleep来写Timer。这种“自定义”的Timer肯定是没有由系统内核DPC触发的Timer效率高的。

OK，回到正题，关于Timer的精确度。首先看看SysInternal工具集的clockres的显示：

[![20160725102628](/uploads/2016/07/20160725102628.png)](/uploads/2016/07/20160725102628.png)

从图中可以看出，我这个系统的最大精确度15.6毫秒，最小是0.5毫秒，当前是15.6毫秒。默认情况下，Windows会用最大精确度，因为这样可以减少CPU的消耗，而且高精度的定时器，绝大多数程序都不会用到。基于15.6毫秒这个精度，那么我们设置Timer间隔为15.6毫秒以下都是没有意义的，这里再提一下，Sleep函数在内核也是用的定时器，也就是说这个精确度下，Sleep(10)也是没有意义的，间隔会达到15-16毫秒。

当然，我们有的时候也是需要高精度的定时器的，这个时候我们需要设置时间精度。timeBeginPeriod这个函数就可以完成这个任务，这个函数调用了ntdll的NtSetTimerResolution函数，我们也可以直接调用这个ntdll函数，只不过我们需要动态获得这个函数的地址罢了。值得注意的是，并不是你想设置什么精确度都可以，Windows内部实际上维护了一份可以设置的精度列表，他会选择一个和你设置相近的的精度设置上去，这个列表保存在Hal里面。

好了，再说下Windows时钟，Windows时钟更新时间总是用的最大精度，在我个系统上也就是每次更新时间都是间隔15.6毫秒。也就是说如果用GetTickCount来统计性能问题，最大精度也就是15-16毫秒。举个例子，一段代码运行时间不足15.6毫秒，要么统计结果是0，要么是15-16毫秒，时间精度不会影响Windows时钟更新。

最后说下Windows高精度时钟查询的实现，在2000和XP时代，系统用TSC来演算时间，但是那个时候，多核并不支持TSC同步，这回带来一些问题。Vista系统采用了High Precision Event Timer (HPET)或者ACPI Power Management Timer (PM timer)，但是这种Timer的延时比较高，当然，这个延时是百纳秒级别的，可以说基本上不会对普通程序有什么影响。之后的系统就使用了固定频率的TSC，这样在多核状态下也能保证同步，而且延时很低。更详细的资料可以参考：https://msdn.microsoft.com/en-us/library/windows/desktop/dn553408(v=vs.85).aspx