---
author: admin
comments: true
date: 2017-04-04 10:03:16+00:00
layout: post
slug: 'delphi exception'
title: Delphi异常0EEDFADE
categories:
- Debugging
---

0EEDFADE是Delphi内部异常代码，该异常通常有7个参数，我们用的上的是第二个参数，这个参数指向的是Exception的对象，通过这个对象，我们就可以查出异常的一些信息。

以Delphi XE2为例,Class name的偏移为（不同的版本偏移有所不同）：  
```
x86_vmtClassName = -56(0x38);
x64_vmtClassName = -112(0x70);
```

我们可以用如下命令获取相关信息：  
```
x86: da poi(poi(exception_object)-38)+1;du /c 100 poi(exception_object+4)  
x64: da poi(poi(exception_object)-70)+1;du /c 100 poi(exception_object+8)  

```

以上命令就能获取异常的类名，而exception_object+sizeof(pointer)则是Exception Message的所在偏移，这是一个unicode string。实际效果如下：

```
0:002> da poi(poi(003a2800)-38)+1;du /c 100 poi(003a2800 +4)
00b9ec47  "TTransportExceptionUnknown"
00375b8c  "ServerTransport.Accept() may not return NULL"
```

当然，我们也可以设置event filter去截获异常：  
```
x86: sxe -c "da poi(poi(poi(@ebp+1c))-38)+1;du /c 100 poi(poi(@ebp+1c)+4)" 0EEDFADE
x64: sxe -c "da poi(poi(poi(@rbp+48))-70)+1;du /c 100 poi(poi(@rbp+48)+8)" 0EEDFADE
```
