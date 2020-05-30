import os
import sys
import pathlib
import logging
import time
import pytest
from assertpy import assert_that

from core_def import CoreReturn, CoreModeKey, CoreTaskKey, CoreTaskCmdKey, BlendKey, ImageEnhanceKey, LevelsKey
from mpcore import MangaPrettierCore


@pytest.mark.parametrize('mode, factor', [
    ('brightness', .5),
    ('brightness', 3),
    ('color', .5),
    ('color', 3),
    ('contrast', .5),
    ('contrast', 3),
    ('sharpness', .5),
    ('sharpness', 3)])
def test_image_enhance(mode, factor, logger=logging.getLogger("MangaPrettierCore"), show=False, image_path="./core/test-sample"):

    effects = [
        {CoreTaskKey.TYPE: CoreModeKey.IMAGE_ENHANCE, CoreModeKey.MODE: mode, ImageEnhanceKey.FACTOR: factor}
    ]

    source = os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'Yu-Gi-Oh_01.png')
    if not os.path.exists(source):
        source = os.path.join(image_path, 'Yu-Gi-Oh_01.png')

    do_preview_test(logger, effects, source, show)


@pytest.mark.parametrize('mode, opacity',
                         [('soft_light', .3),
                          ('multiply', .7)])
def test_blend(mode, opacity, logger=logging.getLogger("MangaPrettierCore"), show=False, image_path="./core/test-sample"):

    effects = [
        {CoreTaskKey.TYPE: CoreModeKey.BLEND, CoreModeKey.MODE: mode, BlendKey.OPACITY: opacity}
    ]

    source = os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_02.jpg')
    if not os.path.exists(source):
        source = os.path.join(image_path, 'MachikadoMazoku_02.jpg')

    do_preview_test(logger, effects, source, show)


@pytest.mark.parametrize('mode, shadow, midtones, highlight, outshadow, outhighlight, channel',
                         [('levels', 80, 1.0, 255, 0, 255, 'RGB'),
                          ('levels', 30, 1.0, 240, 0, 255, 'R')])
def test_levels(mode, shadow, midtones, highlight, outshadow, outhighlight, channel, logger=logging.getLogger("MangaPrettierCore"), show=False, image_path="./core/test-sample"):

    effects = [
        {CoreTaskKey.TYPE: CoreModeKey.LEVELS, CoreModeKey.MODE: mode, LevelsKey.SHADOW: shadow,
         LevelsKey.MIDTONES: midtones, LevelsKey.HIGHLIGHT: highlight, LevelsKey.OUTSHADOW: outshadow,
         LevelsKey.OUTHIGHLIGHT: outhighlight, LevelsKey.CHANNEL: channel}
    ]

    source = os.path.join(pathlib.Path().absolute(), '..', 'test-sample', 'MachikadoMazoku_00.jpg')
    if not os.path.exists(source):
        source = os.path.join(image_path, 'MachikadoMazoku_00.jpg')

    do_preview_test(logger, effects, source, show)


def do_preview_test(logger, effects, source, show=False):

    param = {
        CoreTaskKey.COMMAND: CoreTaskCmdKey.RUN_TASK_ASYNC,
        CoreTaskKey.TASK: CoreTaskKey.PREVIEW,
        CoreTaskKey.SOURCE: source,
        CoreTaskKey.EFFECTS: effects,
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
    # logger.addHandler(console_handler)
    logger.setLevel(logging.DEBUG)

    # test_image_enhance('brightness', .5, logger, True)
    # test_image_enhance('brightness', 3, logger, True)
    # test_image_enhance('color', .5, logger, True)
    # test_image_enhance('color', 3, logger, True)
    # test_image_enhance('contrast', .5, logger, True)
    # test_image_enhance('contrast', 3, logger, True)
    # test_image_enhance('sharpness', .5, logger, True)
    # test_image_enhance('sharpness', 3, logger, True)
    # test_blend('soft_light', .7, logger, True)
    # test_blend('multiply', .9, logger, True)
    test_levels('levels', 0, 1, 255, 0, 255, 'RGB', logger, True)

