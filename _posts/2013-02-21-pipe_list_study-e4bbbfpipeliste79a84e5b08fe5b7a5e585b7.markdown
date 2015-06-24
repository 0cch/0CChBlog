---
author: admin
comments: true
date: 2013-02-21 05:40:31+00:00
layout: post
slug: pipe_list_study-%e4%bb%bfpipelist%e7%9a%84%e5%b0%8f%e5%b7%a5%e5%85%b7
title: pipe_list_study —— 仿PipeList的小工具
wordpress_id: 157
categories:
- NTInternals
---

昨天在家看完笑傲江湖,没事可做，看了sysinternals的一个很简单的小工具PipeList，然后逆了下，山寨了一个，并且加按照管道名筛选的功能。工具很简单，一共也就200行代码。使用方法如下：

{% highlight windbg %}
Usage: pipe_list_study.exe [search_pipe_name]

search_pipe_name  ---  List the pipes that has search_pipe_name in the pipe name string.
                       Without this argument pipe_list_study will list all pipes.
{% endhighlight %}

[![20130221114347](/uploads/2013/02/20130221114347.png)](/uploads/2013/02/20130221114347.png)

下载[pipe_list_study](/uploads/2013/02/pipe_list_study.zip)
