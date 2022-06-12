---
author: admin
comments: true
layout: post
slug: 'use async with caution'
title: 谨慎使用std::async
date: 2022-05-02 20:09:08
categories:
- CPP
---

`std::async`是C++11标准引入的函数模板，它用于异步执行某些任务，通常在单独的线程或者线程池中运行，它会返回一个`std::future`用于等待和获取异步执行的结果。
为什么这里说需要谨慎使用呢？其实原因上面一句话也提到了，就是它可能是在单独的线程中运行的。那么躲过我们想并发执行多个异步任务，会导致系统产生多个线程，执行完任务后退出。熟悉操作系统的朋友应该知道，创建线程的操作是非常耗时的，它需要让系统进入到内核，并且执行很多进程和线程相关的操作，另外过多的线程并不能真正的做到异步，因为我们的CPU的执行单元是有限的。所以调用`std::async`是应该谨慎一些的。
接下来让我们看看三大编译器的`std::async`的实现：
首先来看GCC：
[https://github.com/gcc-mirror/gcc/blob/master/libstdc%2B%2B-v3/include/std/future](https://github.com/gcc-mirror/gcc/blob/master/libstdc%2B%2B-v3/include/std/future)
```cpp
// Shared state created by std::async().
  // Starts a new thread that runs a function and makes the shared state ready.
  template<typename _BoundFn, typename _Res>
    class __future_base::_Async_state_impl final
    : public __future_base::_Async_state_commonV2
    {
    public:
      template<typename... _Args>
	explicit
	_Async_state_impl(_Args&&... __args)
	: _M_result(new _Result<_Res>()),
	  _M_fn{{std::forward<_Args>(__args)...}}
	{
	  _M_thread = std::thread{&_Async_state_impl::_M_run, this};
	}

      // Must not destroy _M_result and _M_fn until the thread finishes.
      // Call join() directly rather than through _M_join() because no other
      // thread can be referring to this state if it is being destroyed.
      ~_Async_state_impl()
      {
	if (_M_thread.joinable())
	  _M_thread.join();
      }

    private:
      void
      _M_run()
      {
	__try
	  {
	    _M_set_result(_S_task_setter(_M_result, _M_fn));
	  }
	__catch (const __cxxabiv1::__forced_unwind&)
	  {
	    // make the shared state ready on thread cancellation
	    if (static_cast<bool>(_M_result))
	      this->_M_break_promise(std::move(_M_result));
	    __throw_exception_again;
	  }
      }

      typedef __future_base::_Ptr<_Result<_Res>> _Ptr_type;
      _Ptr_type _M_result;
      _BoundFn _M_fn;
    };
```
很显然使用了`std::thread`创建新线程。
然后再来看Clang：
[https://github.com/llvm/llvm-project/blob/main/libcxx/include/future](https://github.com/llvm/llvm-project/blob/main/libcxx/include/future)
```cpp
template <class _Rp, class _Fp>
_LIBCPP_INLINE_VISIBILITY future<_Rp>
__make_async_assoc_state(_Fp&& __f)
{
    unique_ptr<__async_assoc_state<_Rp, _Fp>, __release_shared_count>
        __h(new __async_assoc_state<_Rp, _Fp>(_VSTD::forward<_Fp>(__f)));
    _VSTD::thread(&__async_assoc_state<_Rp, _Fp>::__execute, __h.get()).detach();
    return future<_Rp>(__h.get());
}
```
同样的，采用了创建新线程的方法。
最后来看看MSVC提供的STL的实现：
[https://github.com/microsoft/STL/blob/main/stl/inc/future](https://github.com/microsoft/STL/blob/main/stl/inc/future)
```cpp
template <class _Rx>
class _Task_async_state : public _Packaged_state<_Rx()> {
    // class for managing associated synchronous state for asynchronous execution from async
public:
    using _Mybase     = _Packaged_state<_Rx()>;
    using _State_type = typename _Mybase::_State_type;

    template <class _Fty2>
    _Task_async_state(_Fty2&& _Fnarg) : _Mybase(_STD forward<_Fty2>(_Fnarg)) {
        _Task = ::Concurrency::create_task([this]() { // do it now
            this->_Call_immediate();
        });

        this->_Running = true;
    }

    ~_Task_async_state() noexcept override {
        _Wait();
    }

    void _Wait() override { // wait for completion
        _Task.wait();
    }

    _State_type& _Get_value(bool _Get_only_once) override {
        // return the stored result or throw stored exception
        _Task.wait();
        return _Mybase::_Get_value(_Get_only_once);
    }

private:
    ::Concurrency::task<void> _Task;
};
```
可以看到，微软提供的`std::async`的实现好了一些，它使用了线程池来进行异步操作，这样效率会好不少。值得一提的是，这里使用的是微软提供Parallel Patterns Library (PPL)库，专门用于多线程和并行计算的，和Intel的TBB比较类似。
由此可见，如果需要大量使用异步操作执行任务，依赖`std::async`的效率是不太可靠的，我们最好是能够使用更高效的线程池的方案。
