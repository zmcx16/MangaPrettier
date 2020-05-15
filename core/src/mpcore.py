import sys
import argparse
import logging
from PIL import Image
import numpy as np
import base64
import zerorpc
import io
import uuid
import threading

from blackwhite import BlackWhite
from coredef import CoreReturn, CoreModeKey, CoreTaskKey, CoreTaskCmdKey


class MangaPrettierCore(object):

    logger = None
    task_dict = {}  # id:{'ret': 0, 'img': 'data'}  ret: 0: finished, 1: processing, -1: exception error
    task_dict_lock = threading.Lock()

    def __init__(self, mplogger):
        self.logger = mplogger

    def __test_connect(self):

        try:
            self.logger.info('do testConnect')
            return {CoreTaskKey.RETURN: CoreReturn.SUCCESS}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            image_src = param[CoreTaskKey.SOURCE]
            image = np.array(Image.open(image_src))

            h, w, layers = image.shape
            if layers == 3:
                image = np.dstack((image, np.zeros((h, w), dtype=np.uint8) + 255))

            # self.logger.debug(image)
            # self.logger.debug(image.shape)
            image_org = Image.fromarray(image)
            with io.BytesIO() as output:
                image_org.save(output, format='png')
                img_org_arr = output.getvalue()


            for config in param[CoreTaskKey.EFFECTS]:
                mode = MangaPrettierCore.ModeDict[config[CoreTaskKey.TYPE]]
                image = mode.run(image, config, param[CoreTaskKey.SHOW])

            image = Image.fromarray(image)
            with io.BytesIO() as output:
                image.save(output, format='png')
                img_arr = output.getvalue()

            self.logger.info('run_task end')
            # print(base64.encodebytes(img_arr).decode('ascii'))
            return {CoreTaskKey.RETURN: CoreReturn.SUCCESS,
                    CoreTaskKey.IMAGE: base64.encodebytes(img_arr).decode('ascii'),
                    CoreTaskKey.IMAGE_ORG: base64.encodebytes(img_org_arr).decode('ascii'),
                    CoreTaskKey.IMAGE_INFO: {CoreTaskKey.WIDTH: w, CoreTaskKey.HEIGHT: h}}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __run_task_thread(self, t_param):

        resp = self.__run_task(t_param[CoreTaskKey.PARAMETER])

        if resp is not None and resp[CoreTaskKey.RETURN] == 0:
            self.task_dict[t_param[CoreTaskKey.TASK_ID]] = {CoreTaskKey.RETURN: CoreReturn.SUCCESS,
                                                            CoreTaskKey.IMAGE: resp[CoreTaskKey.IMAGE],
                                                            CoreTaskKey.IMAGE_ORG: resp[CoreTaskKey.IMAGE_ORG],
                                                            CoreTaskKey.IMAGE_INFO: resp[CoreTaskKey.IMAGE_INFO]}
        else:
            self.task_dict[t_param[CoreTaskKey.TASK_ID]] = {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR,
                                                            CoreTaskKey.IMAGE: ''}

    def run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            if param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.WARM_UP or \
                    param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.TEST_CONNECT:
                resp = self.__test_connect()

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.RUN_TASK:
                resp = self.__run_task(param)

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.RUN_TASK_ASYNC:

                task_id = str(uuid.uuid4())
                self.task_dict_lock.acquire()
                self.task_dict[task_id] = {CoreTaskKey.RETURN: CoreReturn.PROCESSING, CoreTaskKey.IMAGE: '',
                                           CoreTaskKey.IMAGE_ORG: '', CoreTaskKey.IMAGE_INFO: {}}
                self.task_dict_lock.release()

                t_param = {CoreTaskKey.TASK_ID: task_id, CoreTaskKey.PARAMETER: param}
                t = threading.Thread(target=self.__run_task_thread, args=(t_param,))
                t.start()
                resp = {CoreTaskKey.RETURN: CoreReturn.SUCCESS, CoreTaskKey.TASK_ID: task_id}

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.GET_TASK_RESULT:
                task_id = param[CoreTaskKey.TASK_ID]

                self.task_dict_lock.acquire()
                if task_id in self.task_dict:
                    resp = {CoreTaskKey.RETURN: self.task_dict[task_id][CoreTaskKey.RETURN],
                            CoreTaskKey.IMAGE: self.task_dict[task_id][CoreTaskKey.IMAGE],
                            CoreTaskKey.IMAGE_ORG: self.task_dict[task_id][CoreTaskKey.IMAGE_ORG],
                            CoreTaskKey.IMAGE_INFO: self.task_dict[task_id][CoreTaskKey.IMAGE_INFO]}

                    if self.task_dict[task_id][CoreTaskKey.RETURN] == CoreReturn.SUCCESS:
                        self.task_dict.pop(task_id, None)
                else:
                    resp = {CoreTaskKey.RETURN: CoreReturn.TASK_NOT_FOUND, CoreTaskKey.IMAGE: ''}
                self.task_dict_lock.release()

            self.logger.info('run_task end')
            return resp

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    ModeDict = {
        CoreModeKey.BLACK_WHITE: BlackWhite
    }


if __name__ == "__main__":

    logger = logging.getLogger("MangaPrettierCore")
    formatter = logging.Formatter('%(asctime)s %(levelname)s : %(message)s - %(funcName)s (%(lineno)d)')
    file_handler = logging.FileHandler("C:\\zmcx16\\MangaPrettier\\gui\\core.log")
    file_handler.setFormatter(formatter)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.formatter = formatter
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.setLevel(logging.DEBUG)
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("-port", dest="port")
        args = parser.parse_args()
        if args.port:
            s = zerorpc.Server(MangaPrettierCore(logger))
            s.bind("tcp://0.0.0.0:" + args.port)
            s.run()

        else:
            logger.error('Need assign port.')

    except Exception as exc:
        logger.error('exception = %s', exc, exc_info=True)
