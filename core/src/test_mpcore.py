import os
import sys
import pathlib
import logging
from assertpy import assert_that

from mpcore import MangaPrettierCore


def test_soft_light(logger, show=False):

    param = {
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
    assert_that(core.runTask(param)).is_not_none()


def test_multiply(logger, show=False):

    param = {
        'type': 'bw',
        'src': os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg'),
        'effects': [
            {'mode': 'multiply', 'opacity': .8},
            {'mode': 'multiply', 'opacity': .8},
            {'mode': 'multiply', 'opacity': .8}
        ],
        'show': show
    }
    core = MangaPrettierCore(logger)
    assert_that(core.runTask(param)).is_not_none()


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
    test_multiply(logger, True)
