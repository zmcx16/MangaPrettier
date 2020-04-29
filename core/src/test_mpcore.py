import os
import sys
import pathlib
import logging
import time
from assertpy import assert_that

from mpcore import MangaPrettierCore


def test_soft_light(logger, show=False):

    param = {
        'cmd': 'run_task',
        'type': 'bw',
        'src': os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'Yu-Gi-Oh_01.png'),
        'effects': [
            {'mode': 'soft_light', 'opacity': .8},
            {'mode': 'soft_light', 'opacity': .8},
            {'mode': 'soft_light', 'opacity': .8}
        ],
        'show': show
    }

    core = MangaPrettierCore(logger)
    assert_that(core.run_task(param)).is_not_none()


def test_multiply(logger, show=False):

    param = {
        'cmd': 'run_task',
        'type': 'bw',
        'src': os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg'),
        'effects': [
            #{'mode': 'multiply', 'opacity': .8},
            #{'mode': 'multiply', 'opacity': .8},
            {'mode': 'multiply', 'opacity': .8}
        ],
        'show': show
    }
    core = MangaPrettierCore(logger)
    assert_that(core.run_task(param)).is_not_none()


def test_multiply_async(logger, show=False):

    param = {
        'cmd': 'run_task_async',
        'type': 'bw',
        'src': os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg'),
        'effects': [
            #{'mode': 'multiply', 'opacity': .8},
            #{'mode': 'multiply', 'opacity': .8},
            {'mode': 'multiply', 'opacity': .8}
        ],
        'show': show
    }
    core = MangaPrettierCore(logger)
    resp = core.run_task(param)
    assert_that(resp).is_not_none()
    assert_that(resp['task_id']).is_not_none()

    retry_cnt = 30 * 10
    test_result = -1
    while retry_cnt > 0:
        task_result = core.run_task({'cmd': 'get_task_result', 'task_id': resp['task_id']})
        if task_result['ret'] == 0:
            # print(task_result)
            test_result = 0
            break
        elif task_result['ret'] == 1:
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
