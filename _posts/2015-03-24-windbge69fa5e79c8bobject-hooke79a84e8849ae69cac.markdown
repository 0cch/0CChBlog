---
author: admin
comments: true
date: 2015-03-24 02:08:18+00:00
layout: post
slug: windbg%e6%9f%a5%e7%9c%8bobject-hook%e7%9a%84%e8%84%9a%e6%9c%ac
title: Windbg查看Object Hook的脚本
wordpress_id: 534
categories:
- Tips
---

学好Windbg，基本上可以代替很多工具，这次分享一个查看Object Hook的脚本：

{% highlight cpp %}
r @$t0 = 2;
r? @$t1 = ((nt!_OBJECT_TYPE**)@@(nt!ObTypeIndexTable))[@$t0];

.while ((@$t1 & 0xffffffff) != 0) {
	.printf "Type Name:%-20msu\t", @@C++(&@$t1->Name);
	.printf /D "detail\n", @$t1;
	.printf "DumpProcedure        : %y\n", @@C++(@$t1->TypeInfo.DumpProcedure);
	.printf "OpenProcedure        : %y\n", @@C++(@$t1->TypeInfo.OpenProcedure);
	.printf "CloseProcedure       : %y\n", @@C++(@$t1->TypeInfo.CloseProcedure);
	.printf "DeleteProcedure      : %y\n", @@C++(@$t1->TypeInfo.DeleteProcedure);
	.printf "ParseProcedure       : %y\n", @@C++(@$t1->TypeInfo.ParseProcedure);
	.printf "SecurityProcedure    : %y\n", @@C++(@$t1->TypeInfo.SecurityProcedure);
	.printf "QueryNameProcedure   : %y\n", @@C++(@$t1->TypeInfo.QueryNameProcedure);
	.printf "OkayToCloseProcedure : %y\n\n", @@C++(@$t1->TypeInfo.OkayToCloseProcedure);
	
	r @$t0 = @$t0 + 1;
	r? @$t1 = ((nt!_OBJECT_TYPE**)@@(nt!ObTypeIndexTable))[@$t0];
};
 {% endhighlight %}

[![20150324095806](/uploads/2015/03/20150324095806.png)](/uploads/2015/03/20150324095806.png)
