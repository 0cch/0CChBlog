---
author: admin
comments: true
date: 2015-07-01 00:11:15+00:00
layout: post
slug: 'dump-pe-with-windbg-script'
title: 用Windbg script将内存中的PE文件dump出来
categories:
- Tips
---

最近看到有些恶意程序，从网络上下载PE文件后，直接放在内存里重定位和初始化，为了能将其dump出来，所以写了这个Windbg脚本。

{% highlight windbg %}
.foreach( place  { !address /f:VAR,MEM_PRIVATE,MEM_COMMIT /c:"s -[1]a %1 %2 \"MZ\"" } ) 
{
	ad *
	.catch {
		r @$t2 = place;
		r @$t0 = place;
		r @$t1 = @@C++(((ntdll!_IMAGE_DOS_HEADER *)@$t0)->e_lfanew);
		r @$t0 = @$t0 + @$t1;
		r @$t1 = $vvalid(@$t0, 4);

		.if (@@C++(@$t1 && @@C++(((ntdll!_IMAGE_NT_HEADERS *)@$t0)->Signature) == 0x00004550))
		{
			r @$t1 = @@C++(((ntdll!_IMAGE_NT_HEADERS *)@$t0)->OptionalHeader.SizeOfImage);
			.printf "%08x  %08x\n", @$t2, @$t1;
			aS /x start_addr @$t2
			aS /x dump_size @$t1
			.block {
				aS target_file e:\\${start_addr}.dll
			}
			
			.block {
				.printf "${target_file}"
				.writemem "${target_file}" ${start_addr} L?${dump_size}
			}
		}
	}
}

{% endhighlight %}