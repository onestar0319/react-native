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

namespace facebook::react {

class RuntimeScheduler_Legacy final : public RuntimeSchedulerBase {
 public:
  RuntimeScheduler_Legacy(
      RuntimeExecutor runtimeExecutor,
      std::function<RuntimeSchedulerTimePoint()> now =
          RuntimeSchedulerClock::now);

  /*
   * Not copyable.
   */
  RuntimeScheduler_Legacy(const RuntimeScheduler_Legacy&) = delete;
  RuntimeScheduler_Legacy& operator=(const RuntimeScheduler_Legacy&) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler_Legacy(RuntimeScheduler_Legacy&&) = delete;
  RuntimeScheduler_Legacy& operator=(RuntimeScheduler_Legacy&&) = delete;

  void scheduleWork(RawCallback&& callback) const noexcept override;

  /*
   * Grants access to the runtime synchronously on the caller's thread.
   *
   * Shouldn't be called directly. it is expected to be used
   * by dispatching a synchronous event via event emitter in your native
   * component.
   */
  void executeNowOnTheSameThread(RawCallback&& callback) override;

  /*
   * Adds a JavaScript callback to priority queue with given priority.
   * Triggers workloop if needed.
   *
   * Thread synchronization must be enforced externally.
   */
  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      jsi::Function&& callback) noexcept override;

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
   * Thread synchronization must be enforced externally.
   */
  RuntimeSchedulerTimePoint now() const noexcept override;

  /*
   * Expired task is a task that should have been already executed. Designed to
   * be called in the event pipeline after an event is dispatched to React.
   * React may schedule events with immediate priority which need to be handled
   * before the next event is sent to React.
   *
   * Thread synchronization must be enforced externally.
   */
  void callExpiredTasks(jsi::Runtime& runtime) override;

 private:
  mutable std::priority_queue<
      std::shared_ptr<Task>,
      std::vector<std::shared_ptr<Task>>,
      TaskPriorityComparer>
      taskQueue_;

  const RuntimeExecutor runtimeExecutor_;
  mutable SchedulerPriority currentPriority_{SchedulerPriority::NormalPriority};

  /*
   * Counter indicating how many access to the runtime have been requested.
   */
  mutable std::atomic<uint_fast8_t> runtimeAccessRequests_{0};

  mutable std::atomic_bool isSynchronous_{false};

  void startWorkLoop(jsi::Runtime& runtime) const;

  /*
   * Schedules a work loop unless it has been already scheduled
   * This is to avoid unnecessary calls to `runtimeExecutor`.
   */
  void scheduleWorkLoopIfNecessary() const;

  void executeTask(
      jsi::Runtime& runtime,
      const std::shared_ptr<Task>& task,
      bool didUserCallbackTimeout) const;

  /*
   * Returns a time point representing the current point in time. May be called
   * from multiple threads.
   */
  std::function<RuntimeSchedulerTimePoint()> now_;

  /*
   * Flag indicating if callback on JavaScript queue has been
   * scheduled.
   */
  mutable std::atomic_bool isWorkLoopScheduled_{false};

  /*
   * This flag is set while performing work, to prevent re-entrancy.
   */
  mutable std::atomic_bool isPerformingWork_{false};
};

} // namespace facebook::react
