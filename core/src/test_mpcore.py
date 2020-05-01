import os
import sys
import pathlib
import logging
import time
from assertpy import assert_that

from coredef import CoreReturn, CoreModeKey, CoreTaskKey, CoreTaskCmdKey, BlackWhiteKey
from mpcore import MangaPrettierCore


def test_soft_light(logger, show=False):

    param = {
        CoreTaskKey.COMMAND: CoreTaskCmdKey.RUN_TASK,
        CoreTaskKey.TYPE: CoreModeKey.BLACK_WHITE,
        CoreTaskKey.SOURCE: os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'Yu-Gi-Oh_01.png'),
        CoreTaskKey.EFFECTS: [
            {CoreModeKey.MODE: BlackWhiteKey.SOFT_LIGHT, BlackWhiteKey.OPACITY: .8},
            {CoreModeKey.MODE: BlackWhiteKey.SOFT_LIGHT, BlackWhiteKey.OPACITY: .8},
            {CoreModeKey.MODE: BlackWhiteKey.SOFT_LIGHT, BlackWhiteKey.OPACITY: .8}
        ],
        CoreTaskKey.SHOW: show
    }

    core = MangaPrettierCore(logger)
    assert_that(core.run_task(param)[CoreTaskKey.RETURN]).is_zero()


def test_multiply(logger, show=False):

    param = {
        CoreTaskKey.COMMAND: CoreTaskCmdKey.RUN_TASK,
        CoreTaskKey.TYPE: CoreModeKey.BLACK_WHITE,
        CoreTaskKey.SOURCE: os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg'),
        CoreTaskKey.EFFECTS: [
            {CoreModeKey.MODE: BlackWhiteKey.MULTIPLY, BlackWhiteKey.OPACITY: .8}
        ],
        CoreTaskKey.SHOW: show
    }
    core = MangaPrettierCore(logger)
    assert_that(core.run_task(param)[CoreTaskKey.RETURN]).is_zero()


def test_multiply_async(logger, show=False):

    param = {
        CoreTaskKey.COMMAND: CoreTaskCmdKey.RUN_TASK_ASYNC,
        CoreTaskKey.TYPE: CoreModeKey.BLACK_WHITE,
        CoreTaskKey.SOURCE: os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg'),
        CoreTaskKey.EFFECTS: [
            {CoreModeKey.MODE: BlackWhiteKey.MULTIPLY, BlackWhiteKey.OPACITY: .8}
        ],
        CoreTaskKey.SHOW: show
    }
    core = MangaPrettierCore(logger)
    resp = core.run_task(param)
    assert_that(resp[CoreTaskKey.RETURN]).is_zero()
    assert_that(resp[CoreTaskKey.TASK_ID]).is_not_none()

    retry_cnt = 30 * 10
    test_result = -1
    while retry_cnt > 0:
        task_result = core.run_task({CoreTaskKey.COMMAND: CoreTaskCmdKey.GET_TASK_RESULT,
                                     CoreTaskKey.TASK_ID: resp[CoreTaskKey.TASK_ID]})
        if task_result[CoreTaskKey.RETURN] == 0:
            # print(task_result)
            test_result = 0
            break
        elif task_result[CoreTaskKey.RETURN] == 1:
            # print(task_result)
            time.sleep(0.1)
            retry_cnt -= 1
        else:
            break

    assert_that(test_result).is_zero()


if __name__ == "__main__":

    logger = logging.getLogger("MangaPrettierCore")
    formatter = logging.Formatter('%(asctime)s %(levelname)s : %(message)s - %(funcName)s (%(lineno)d)')
    file_handler = logging.FileHandler("core.log")
    file_handler.setFormatter(formatter)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.formatter = formatter
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.setLevel(logging.DEBUG)

    # test_soft_light(logger, True)
    # test_multiply(logger, True)
    test_multiply_async(logger, True)
