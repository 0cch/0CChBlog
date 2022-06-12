---
author: admin
comments: true
layout: post
slug: 'pass params'
title: 值传参
date: 2022-04-12 20:03:43
categories:
- CPP
---

我在大学里学C++的时候，印象最为深刻的是老师反复告诫我们，应该如何传递函数参数。为了避免发生不必要的内存拷贝和复杂的对象构造，一般来说对于复杂对象都会采取使用传递引用的方式，当然如果参数不会被改变，最好使用常量引用，只有一些基础类型可以通过值传递参数。
按照上述方式写代码确实不会任何问题，不过C++向来是一门追求极致的语言，在效率方面更是如此，所以在C++17引入了`std::string_view`，并且推荐使用值传递的方式作为参数来传递，例如：
```cpp
size_t ret_sv_byval(std::string_view sv) { return sv.size(); }
```
上面的代码通过值来传递`std::string_view`，而不是通过引用，下面我们就来探讨为何这里更加推荐使用通过值来传递参数。
首先，也是最容易理解的一点，能够使用值传递`std::string_view`必然是因为它足够简单。它的典型的实现只有两个成员：指向常量字符串的指针和字符串大小。值得一提的是，`std::string_view`并不是C++17才出现在我们视野中的，实际上在chromium和llvm中，早就出现了类似的实现。在C++标准的草案也可以追述到2012年的n3442，当时`std::string_view`还被称为`string_ref`。后来到了2014年，经过了大约7个版本的修订，才有了我们今天看到的`std::string_view`。
我们当然不能因为`std::string_view`足够简单认为使用传值的方式比传递引用的方式高效，这需要我们拿出其他的证据。

### 通过传值使用std::string_view可以消除引用中的内存操作
我们都知道，对象的拷贝是在caller中发生的，例如下面这两行代码：
```cpp
size_t ret_str_byref(const std::string& s) { return s.size(); }
size_t ret_str_byval(std::string s) { return s.size(); }
```
在使用-O2的优化选项进行编译的情况下，他们生成的汇编代码是相同的，都是：
```cpp
ret_str_byref:
  mov eax, DWORD PTR [rdi+8]
  ret
ret_str_byval:
  mov eax, DWORD PTR [rdi+8]
  ret
```
因为临时对象的拷贝在调用者函数中发生，所以这里不会有任何区别。可以看到，这里都使用了内存访问，访问了rdi+8的数据。这里如果我们使用`std::string_view`会如何呢？
```cpp
size_t ret_sv_byval(std::string_view sv) { return sv.size(); }
```
对应的汇编代码为：
```cpp
ret_sv_byval:
  mov eax, edi
  ret
```
显然，这里直接使用了寄存器，没有涉及到任何内存的访问，这样访问效率必然是有所提升的。
引用的另一个劣势是，在一个不需要涉及内存的操作中，因为引用语义和内存相关，导致编译器会强行将对象设置在内存中，来看看下面这个例子：
```cpp
size_t sv_call_val(std::string_view sv) {return ret_sv_byval(sv);}
size_t sv_call_ref(std::string_view sv) {return ret_sv_byref(sv);}
```
这两个函数非常简单，直接使用参数调用后续函数，不过编译后的代码截然不同：
```cpp
sv_call_val
  jmp ret_sv_byval
sv_call_ref
  sub rsp, 24
  mov qword ptr [rsp + 8], rdi
  mov qword ptr [rsp + 16], rsi
  lea rdi, [rsp + 8]
  call ret_sv_byref
  add rsp, 24
  ret
```
可以看出，前者可以直接执行jmp，跳到目标函数。后者，也就是穿引用的函数，则是需要先将数据写到栈上，然后在调用函数，显然前者的效率更高。
### 通过传值使用std::string_view可以帮助编译器进行优化
程序的编译优化并不是容易的事情，编译器要考虑非常多的因素，例如外部对内部的影响等。传值和传引用的区别在于，传递引用的对象可能会被其他外部因素干扰导致编译器没办法进行优化，但是传值就不存在这样的问题，因为传值是拷贝，不会被外部影响，编译器优化起来更加得心应手，来看看下面的代码：
```cpp
size_t ret_sv_byval(std::string_view sv, size_t& troublemaker) {
    size_t temp = troublemaker;
    troublemaker++;
    size_t retval = sv.size();
    troublemaker = temp;
    return retval;
}

size_t ret_sv_byref(const std::string_view& sv, size_t& troublemaker) {
    size_t temp = troublemaker;
    troublemaker++;
    size_t retval = sv.size();
    troublemaker = temp;
    return retval;
}
```
上面两个函数唯一的区别就是`sv`是传值还是传引用，看似没有太大区别，但是我们来看看汇编代码：
```cpp
ret_sv_byval
  mov rax, rdi
  ret
ret_sv_byref
  mov rcx, qword ptr [rsi]
  lea rax, [rcx + 1]
  mov qword ptr [rsi], rax
  mov rax, qword ptr [rdi]
  mov qword ptr [rsi], rcx
  ret
```
可以看到，前者就是简单了一条寄存器操作就返回了，`temp`和`troublemaker`都没有给函数带来任何影响。而后者就完全不同了，因为传递的是引用，即使是常量引用，也导致编译器无法对代码进行优化。因为对于编译器而言，并不知道`troublemaker`是否会对`sv`的内部有所影响，只能按照代码进行编译。
至此，我们可以得到结论是，对于简单对象，例如使用寄存器就能传递其数据的对象，我们可以使用传值的方式传递参数，例如简单的`std::pair`，`std::span`等等。当然比较复杂的对象，还是要使用传递引用的方式的。
