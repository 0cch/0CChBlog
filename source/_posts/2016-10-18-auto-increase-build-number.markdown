---
author: admin
comments: true
date: 2016-10-18 9:41:08+00:00
layout: post
slug: 'auto-increase-build-number'
title: 编译时自动增加build number
categories:
- Tips
---

最近和朋友讨论版本号常用的几种规范，前三位<主版本>.<子版本>.<修正版本>基本上一致，不需要详说。主要区别产生在最后一位，有的是build number，有的是时间日期，还有的是git或者svn的revision。我习惯用build number，每次编译都会增加版本号最后一位的数字。但是手动去修改明显不科学也不可靠，所以给和我有一样习惯的朋友分享一个我早年写的python脚本，无论是自己的工具还是公司的产品我一直都在用这个。

```
用法就是在VS的工程属性Build Event -> Pre Build Event里设置x:\incbuildnum.py $(ProjectDir)$(ProjectName).rc。
```

{% codeblock lang:python %}

import re
import os
import sys
import shutil

if os.path.isfile(sys.argv[1] + ".bak"):
	os.remove(sys.argv[1] + ".bak")
shutil.copy(sys.argv[1], sys.argv[1] + ".bak")

with open(sys.argv[1], 'r+') as content_file:
    content = content_file.read()
    
    
    m = re.search("VALUE \"FileVersion\", \"(([\\d]+).[ ]*)*([\\d]+)\"", content)
    new_ver = str(int(m.group(3)) + 1)
    content = re.sub("(VALUE \"FileVersion\", \"([\\d]+.[ ]*)*)[\\d]+\"", "\\g<1>" + new_ver + "\"", content)

    m = re.search("FILEVERSION (([\\d]+).[ ]*)*([\\d]+)", content)
    new_ver = str(int(m.group(3)) + 1)
    content = re.sub("(FILEVERSION ([\\d]+.[ ]*)*)([\\d]+)", "\\g<1>" + new_ver, content)

    m = re.search("VALUE \"ProductVersion\", \"(([\\d]+).[ ]*)*([\\d]+)\"", content)
    new_ver = str(int(m.group(3)) + 1)
    content = re.sub("(VALUE \"ProductVersion\", \"([\\d]+.[ ]*)*)[\\d]+\"", "\\g<1>" + new_ver + "\"", content)

    m = re.search("PRODUCTVERSION (([\\d]+).[ ]*)*([\\d]+)", content)
    new_ver = str(int(m.group(3)) + 1)
    content = re.sub("(PRODUCTVERSION ([\\d]+.[ ]*)*)([\\d]+)", "\\g<1>" + new_ver, content)
    
    content_file.seek(0)
    content_file.write(content)
    content_file.truncate()
    content_file.close()
    

{% endcodeblock %}