---
author: admin
comments: true
date: 2014-08-16 02:34:15+00:00
layout: post
slug: dump-stl%e7%9a%84vector%ef%bc%8clist%ef%bc%8cmap%e7%9a%84%e4%b8%89%e4%b8%aawindbg%e8%84%9a%e6%9c%ac
title: Dump stl的vector，list，map的三个windbg脚本
wordpress_id: 460
categories:
- Debugging
---

用Windbg查看stl的容器实在是已经让人悲伤的事情，为了方便，所以写了这么3个脚本
vector:

{% highlight cpp %}
r? $t0 = ${$arg1}

.if (${/d:$VectorType}) {
	r? $t0 = @@C++(*((${$VectorType} *)@$t0))
}

.if (${/d:$arg2}) { 
    .if ($sicmp("${$arg2}", "-c") == 0) { 
        r $t2 = 0 
        aS ${/v:command} "${$arg3}" 
    } 
}
.else { 
    r $t2 = 1 
    aS ${/v:command} " " 
}


r? $t1 = @@C++(@$t0._Mylast)
r? $t0 = @@C++(@$t0._Myfirst)

.printf "size = %d\n", @@C++((@$t1 - @$t0))  

.while (@$t0 != @$t1) {
	.if ($t2 == 1) {
		?? @@c++(@$t0->_Bx)
	}
	.else {
		r? $t9 = @$t0->_Bx
		command
	}

	r? $t0=@$t0+1
}

ad command 
 {% endhighlight %}

list:

{% highlight cpp %}
r? $t0 = ${$arg1}

.if (${/d:$ListType}) {
	r? $t0 = @@C++(*((${$ListType} *)@$t0))
}

.if (${/d:$arg2}) { 
    .if ($sicmp("${$arg2}", "-c") == 0) { 
        r $t2 = 0 
        aS ${/v:command} "${$arg3}" 
    } 
}
.else { 
    r $t2 = 1 
    aS ${/v:command} " " 
}

.printf "size = %d\n", @@C++(@$t0._Mysize)

r? $t1 = @@C++(@$t0._Myhead)
r? $t0 = @@C++(@$t0._Myhead)
r? $t0 = @@C++(@$t0->_Next)

.while (@$t0 != @$t1) {
	.if ($t2 == 1) {
		?? @@c++(@$t0->_Myval._Bx)
	}
	.else {
		r? $t9 = @$t0->_Myval._Bx
		command
	}

	r? $t0 = @@C++(@$t0->_Next)
}

ad command 
 {% endhighlight %}

map:

{% highlight cpp %}
.if ($sicmp("${$arg1}", "-n") == 0) { 

    .if (@@C++(@$t0->_Left) != @@C++(@$t1)) { 
        .push /r /q 
        r? $t0 = @$t0->_Left 
        $$>a< ${$arg0} -n 
        .pop /r /q 
    } 
	
	.if (@@C++(@$t0->_Isnil) == 0) { 
        .if (@$t2 == 1) { 
            .printf /D "%p\n", @$t0, @$t0 
            .printf "key = " 
            ?? @$t0->_Myval.first 
            .printf "value = " 
            ?? @$t0->_Myval.second 
        }
		.else { 
            r? $t9 = @$t0->_Myval 
            command 
        } 
    }
	
    .if (@@C++(@$t0->_Right) != @@C++(@$t1)) { 
        .push /r /q 
        r? $t0 = @$t0->_Right 
        $$>a< ${$arg0} -n 
        .pop /r /q 
    }
	
}
.else { 

	r? $t0 = ${$arg1}

	.if (${/d:$MapType}) {
		r? $t0 = @@C++(*((${$MapType} *)@$t0))
	}

    .if (${/d:$arg2}) { 
        .if ($sicmp("${$arg2}", "-c") == 0) { 
            r $t2 = 0 
            aS ${/v:command} "${$arg3}" 
        } 
    }
	.else { 
        r $t2 = 1 
        aS ${/v:command} " " 
    }
	
	

	.printf "size = %d\n", @@C++(@$t0._Mysize)  
     
	r? $t0 = @$t0._Myhead->_Parent 
	r? $t1 = @$t0->_Parent
	
    $$>a< ${$arg0} -n

    ad command 
}
 {% endhighlight %}
