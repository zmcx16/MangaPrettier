import os
import pathlib
from assertpy import assert_that

from mpcore import MangaPrettierCore


def test_soft_light(show=False):

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

    core = MangaPrettierCore()
    assert_that(core.run(param)).is_not_none()


def test_multiply(show=False):

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
    core = MangaPrettierCore()
    assert_that(core.run(param)).is_not_none()


if __name__ == "__main__":

    # test_soft_light(True)
    test_multiply(True)
