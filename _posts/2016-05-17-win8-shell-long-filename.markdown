---
author: admin
comments: true
date: 2016-05-17 16:16:56+00:00
layout: post
slug: 'win8-shell-long-filename'
title: Windows 8 Shell API对于长路径文件名的支持
categories:
- Tips
---

在Windows 8之前，Shell API对于长路径的文件名的支持并不理想。比如PathAppend这个函数，函数规定pszPath，也就是第一个参数，它的buffer大小必须要能够容纳MAX_PATH个字符。第二个参数pszMore也不能超过MAX_PATH的长度。这样的API不仅不能满足我们对长文件路径需求，同时也可能让我们的软件由于字符串检查不严格出现严重BUG和漏洞。

还好，这个问题在Windows 8以及以后的系统上得到了解决。还是以路径拼接为例。微软向我们介绍了PathCchAppend和PathCchAppendEx函数。其中PathCchAppend函数，增加了cchPath参数，用来指定输出buffer的大小。用这样的方式来加强参数的检查，增加了函数的安全性。而PathCchAppendEx这个函数在PathCchAppend基础上，又加入了dwFlags，现在这个标志只有PATHCCH_ALLOW_LONG_PATHS，意思就是让我们的路径名超过MAX_PATH。

不知道微软设计PathCchAppend和PathCchAppendEx这两个API的时候是怎么样的一个想法，我觉得完全没必要设计成两个函数，一个PathCchAppendEx就足够了。大家是不是也有这个疑问呢？

最后，由于Windows 7现在的使用量还是非常大的，我们也不能因为要使用这些新的API而放弃兼容老版本的Windows。比较合适的做法还是动态导入这些函数，如果成功了就可以使用新的函数，失败就用老的函数。另外值得注意的是，PathCchAppend这类新的函数并不是放在shlwapi.dll里面，而是在kernelbase.dll，动态获取函数的时候需要注意这一点。