/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerClock.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <atomic>
#include <memory>
#include <queue>
#include <shared_mutex>

namespace facebook::react {

class RuntimeScheduler_Modern final : public RuntimeSchedulerBase {
 public:
  explicit RuntimeScheduler_Modern(
      RuntimeExecutor runtimeExecutor,
      std::function<RuntimeSchedulerTimePoint()> now =
          RuntimeSchedulerClock::now);

  /*
   * Not copyable.
   */
  RuntimeScheduler_Modern(const RuntimeScheduler_Modern&) = delete;
  RuntimeScheduler_Modern& operator=(const RuntimeScheduler_Modern&) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler_Modern(RuntimeScheduler_Modern&&) = delete;
  RuntimeScheduler_Modern& operator=(RuntimeScheduler_Modern&&) = delete;

  /*
   * Alias for scheduleTask with immediate priority.
   *
   * To be removed when we finish testing this implementation.
   * All callers should use scheduleTask with the right priority afte that.
   */
  void scheduleWork(RawCallback&& callback) noexcept override;

  /*
   * Grants access to the runtime synchronously on the caller's thread.
   *
   * Shouldn't be called directly. it is expected to be used
   * by dispatching a synchronous event via event emitter in your native
   * component.
   */
  void executeNowOnTheSameThread(RawCallback&& callback) override;

  /*
   * Adds a JavaScript callback to the priority queue with the given priority.
   * Triggers workloop if needed.
   */
  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      jsi::Function&& callback) noexcept override;

  /*
   * Adds a custom callback to the priority queue with the given priority.
   * Triggers workloop if needed.
   */
  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      RawCallback&& callback) noexcept override;

  /*
   * Cancelled task will never be executed.
   *
   * Operates on JSI object.
   * Thread synchronization must be enforced externally.
   */
  void cancelTask(Task& task) noexcept override;

  /*
   * Return value indicates if host platform has a pending access to the
   * runtime.
   *
   * Can be called from any thread.
   */
  bool getShouldYield() const noexcept override;

  /*
   * Return value informs if the current task is executed inside synchronous
   * block.
   *
   * Can be called from any thread.
   */
  bool getIsSynchronous() const noexcept override;

  /*
   * Returns value of currently executed task. Designed to be called from React.
   *
   * Thread synchronization must be enforced externally.
   */
  SchedulerPriority getCurrentPriorityLevel() const noexcept override;

  /*
   * Returns current monotonic time. This time is not related to wall clock
   * time.
   *
   * Can be called from any thread.
   */
  RuntimeSchedulerTimePoint now() const noexcept override;

  /*
   * Expired task is a task that should have been already executed. Designed to
   * be called in the event pipeline after an event is dispatched to React.
   * React may schedule events with immediate priority which need to be handled
   * before the next event is sent to React.
   *
   * Thread synchronization must be enforced externally.
   *
   * TODO remove when we add support for microtasks
   */
  void callExpiredTasks(jsi::Runtime& runtime) override;

  /**
   * Schedules a function that notifies or applies UI changes in the host
   * platform, to be executed during the "Update the rendering" step of the
   * event loop. If the step is not enabled, the function is executed
   * immediately.
   */
  void scheduleRenderingUpdate(
      RuntimeSchedulerRenderingUpdate&& renderingUpdate) override;

 private:
  std::atomic<uint_fast8_t> syncTaskRequests_{0};

  std::priority_queue<
      std::shared_ptr<Task>,
      std::vector<std::shared_ptr<Task>>,
      TaskPriorityComparer>
      taskQueue_;

  std::shared_ptr<Task> currentTask_;

  /**
   * This protects the access to `taskQueue_` and `isWorkLoopScheduled_`.
   */
  mutable std::shared_mutex schedulingMutex_;

  const RuntimeExecutor runtimeExecutor_;
  SchedulerPriority currentPriority_{SchedulerPriority::NormalPriority};

  std::atomic_bool isSynchronous_{false};

  void scheduleWorkLoop();
  void startWorkLoop(jsi::Runtime& runtime, bool onlyExpired);

  std::shared_ptr<Task> selectTask(
      RuntimeSchedulerTimePoint currentTime,
      bool onlyExpired);

  void scheduleTask(std::shared_ptr<Task> task);

  /**
   * Follows all the steps necessary to execute the given task.
   * Depending on feature flags, this could also execute its microtasks.
   * In the future, this will include other steps in the Web event loop, like
   * updating the UI in native, executing resize observer callbacks, etc.
   */
  void executeTask(
      jsi::Runtime& runtime,
      const std::shared_ptr<Task>& task,
      RuntimeSchedulerTimePoint currentTime);

  void executeMacrotask(
      jsi::Runtime& runtime,
      std::shared_ptr<Task> task,
      bool didUserCallbackTimeout) const;

  void updateRendering();

  /*
   * Returns a time point representing the current point in time. May be called
   * from multiple threads.
   */
  std::function<RuntimeSchedulerTimePoint()> now_;

  /*
   * Flag indicating if callback on JavaScript queue has been
   * scheduled.
   */
  bool isWorkLoopScheduled_{false};

  std::queue<RuntimeSchedulerRenderingUpdate> pendingRenderingUpdates_;
};

} // namespace facebook::react
