class CoreReturn:
    SUCCESS = 0
    PROCESSING = 1
    EXCEPTION_ERROR = -1
    TASK_NOT_FOUND = -2


class CoreModeKey:
    MODE = 'mode'
    BLEND = 'blend'
    IMAGE_ENHANCE = 'image_enhance'
    LEVELS = 'levels'

class CoreTaskKey:
    RETURN = 'ret'
    EXCEPTION = 'ex'
    IMAGE = 'img'
    IMAGE_ORG = 'img_org'
    IMAGE_INFO = 'img_info'
    WIDTH = 'width'
    HEIGHT = 'height'
    COMMAND = 'cmd'
    PARAMETER = 'param'
    THREAD_ID = 'thread_id'
    DATA = 'data'
    SOURCE = 'src'
    TYPE = 'type'
    EFFECTS = 'effects'
    OUTPUT = 'output'
    TASK_ID = 'task_id'
    SHOW = 'show'
    TASK = 'task'
    IMAGES_PATH = 'imgs_path'
    CURRENT = 'current'
    TOTAL = 'total'

    # task type
    PREVIEW = 'preview'
    BATCH = 'batch'
    STOP_BATCH = 'stop_batch'


class CoreTaskCmdKey:
    WARM_UP = 'warm_up'
    TEST_CONNECT = 'test_connect'
    RUN_TASK = 'run_task'
    RUN_TASK_ASYNC = 'run_task_async'
    GET_TASK_RESULT = 'get_task_result'
    STOP_TASK = 'stop_task'


class OutputKey:
    FORMAT = 'format'

    # format
    PNG = 'PNG'
    JPEG = 'JPEG'
    BMP = 'BMP'

    COMPRESS_LEVEL = 'compress_level'
    QUALITY = 'quality'
    OPTIMIZE = 'optimize'


class BlendKey:
    # config
    OPACITY = 'opacity'

    # effect
    SOFT_LIGHT = 'soft_light'
    MULTIPLY = 'multiply'


class ImageEnhanceKey:
    # config
    FACTOR = 'factor'

    # effect
    BRIGHTNESS = 'brightness'
    COLOR = 'color'
    CONTRAST = 'contrast'
    SHARPNESS = 'sharpness'


class LevelsKey:
    # config
    SHADOW = 'shadow'
    MIDTONES = 'midtones'
    HIGHLIGHT = 'highlight'
    OUTSHADOW = 'outshadow'
    OUTHIGHLIGHT = 'outhighlight'
    CHANNEL = 'channel'

    # config value
    CHANNEL_R = 'R'
    CHANNEL_G = 'G'
    CHANNEL_B = 'B'
    CHANNEL_RGB = 'RGB'

    # effect
    LEVELS = 'levels'
