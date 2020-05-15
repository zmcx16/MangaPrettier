class CoreReturn:
    SUCCESS = 0
    PROCESSING = 1
    EXCEPTION_ERROR = -1
    TASK_NOT_FOUND = -2


class CoreModeKey:
    MODE = 'mode'
    BLACK_WHITE = 'bw'


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
    SOURCE = 'src'
    TYPE = 'type'
    EFFECTS = 'effects'
    TASK_ID = 'task_id'
    SHOW = 'show'


class CoreTaskCmdKey:
    WARM_UP = 'warm_up'
    TEST_CONNECT = 'test_connect'
    RUN_TASK = 'run_task'
    RUN_TASK_ASYNC = 'run_task_async'
    GET_TASK_RESULT = 'get_task_result'


class BlackWhiteKey:
    # config
    OPACITY = 'opacity'

    # effect
    SOFT_LIGHT = 'soft_light'
    MULTIPLY = 'multiply'
