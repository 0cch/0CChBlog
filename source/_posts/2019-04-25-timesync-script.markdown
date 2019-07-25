---
author: admin
comments: true
layout: post
slug: 'timesync python script'
title: 一个时间同步脚本
date: 2019-04-25 17:07:46
categories:
- Tips
---

家里有台电脑不知道为啥一直同步不了网络时间，每隔一段时间就慢个几分钟，于是在网上找了点资料和代码拼凑了一个用于Windows时间同步的python脚本。

```python
# -*- coding: utf-8 -*-
"""
@author: 0cch
"""

from socket import *
import struct
import sys
import time
import datetime
from ctypes             import Structure, windll, pointer
from ctypes.wintypes    import WORD

class SYSTEMTIME(Structure):
  _fields_ = [
      ( 'wYear',            WORD ),
      ( 'wMonth',           WORD ),
      ( 'wDayOfWeek',       WORD ),
      ( 'wDay',             WORD ),
      ( 'wHour',            WORD ),
      ( 'wMinute',          WORD ),
      ( 'wSecond',          WORD ),
      ( 'wMilliseconds',    WORD ),
    ]
SetLocalTime = windll.kernel32.SetLocalTime

NTP_SERVER = "pool.ntp.org"
TIME1970 = 2208988800

clientSocket = socket(AF_INET, SOCK_DGRAM)
clientSocket.settimeout(10)

portNumber = 123
def sntp_client():
    data = '\x1b' + 47 * '\0'
    clientSocket.sendto( data.encode('utf-8'), ( NTP_SERVER, portNumber ))
    data, address = clientSocket.recvfrom(1024)
    if data:
        print ('Response received from:', address)
        t_time = struct.unpack( '!12I', data )[10]
        t_time -= TIME1970
        
        dt = datetime.datetime.fromtimestamp( t_time )
        
        dt_tuple = dt.timetuple()
        st = SYSTEMTIME()
        st.wYear            = dt_tuple.tm_year
        st.wMonth           = dt_tuple.tm_mon
        st.wDayOfWeek       = ( dt_tuple.tm_wday + 1 ) % 7
        st.wDay             = dt_tuple.tm_mday
        st.wHour            = dt_tuple.tm_hour
        st.wMinute          = dt_tuple.tm_min
        st.wSecond          = dt_tuple.tm_sec
        st.wMilliseconds    = 0
         
        ret = SetLocalTime( pointer( st ) )
        if ret == 0:
            print( 'Setting failed. Try as administrator.' )
        else:
            print( 'Successfully.' )
        
    clientSocket.close()

if __name__ == '__main__':
    sntp_client()
```

