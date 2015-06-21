---
author: admin
comments: true
date: 2013-11-01 03:56:59+00:00
layout: post
slug: windbg-script%e4%b8%ad%e8%8e%b7%e5%be%97%e8%b0%83%e8%af%95%e7%8e%af%e5%a2%83%e7%9a%84%e5%9f%ba%e6%9c%ac%e4%bf%a1%e6%81%af
title: Windbg script中获得调试环境的基本信息
wordpress_id: 373
categories:
- Debugging
- Tips
---

今天继续来玩Windbg script。在写复杂的脚本的时候，可能需要根据调试的环境，指定不同的脚本代码来运行。而Windbg貌似没有提供很好的方式，让脚本得知调试环境。还好，我们可以用一些其他的方式获得这些信息，例如：写一个扩展程序来设置这些信息到Aliase上，[0cchext](https://github.com/0cch/0cchext)就实现了这个功能。另外一个方式就是使用脚本自身来获得一些简单的信息，算是个windbg script中的小把戏吧。脚本如下：

{% highlight cpp linenos %}
$$ Initialize script environment
$$ Author: nighxie 
$$ Blog: 0cch.net
$$ @#NtMajorVersion @#NtMinorVersion - System version number.
$$ @#DebugMode - 0:kd 1:lkd 2:user

ad /q ${/v:$sharedata} 

.catch {
    .foreach /pS 2 (${/v:$addr} {!kuser}) {
        aS ${/v:$sharedata} ${$addr};
        .leave;
    }
}

.block {
    r @$t0=${$sharedata};
    aS /x ${/v:@#NtMajorVersion} @@C++(((nt!_KUSER_SHARED_DATA *)@$t0)->NtMajorVersion);
    aS /x ${/v:@#NtMinorVersion} @@C++(((nt!_KUSER_SHARED_DATA *)@$t0)->NtMinorVersion);
}

ad /q ${/v:$sharedata} 

.catch {
    r @$t0 = 0;
    .foreach (${/v:$addr} {lm1m m nt}) {
        r @$t0 = ${$addr};
        .leave;
    }
}

.if ($vvalid(@$t0, 1)) {
    aS ${/v:@#DebugMode} 0;
     .foreach (${/v:$val} {.catch{? @eax}}) {
        .if ($scmp("${$val}", "\'@eax\'")==0) {
            aS ${/v:@#DebugMode} 1;
        }
    }
}
.else {
    aS ${/v:@#DebugMode} 2;
}

{% endhighlight %}


