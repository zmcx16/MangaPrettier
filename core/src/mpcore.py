import sys
import os
from datetime import datetime
import argparse
import logging
from PIL import Image
import numpy as np
import base64
import zerorpc
import io
import uuid
import threading

from image_enhance import ImageEnhance
from blend import Blend
from levels import Levels
from core_def import CoreReturn, CoreModeKey, CoreTaskKey, CoreTaskCmdKey


class MangaPrettierCore(object):

    logger = None
    task_dict = {}  # id:{'ret': 0, 'data': {}}  ret: 0: finished, 1: processing, -1: exception error
    task_dict_lock = threading.Lock()

    thread_status = {}  # id: status  status: True: running, not exist: stopped
    thread_status_lock = threading.Lock()

    def __init__(self, mplogger):
        self.logger = mplogger

    def __test_connect(self):

        try:
            self.logger.info('do testConnect')
            return {CoreTaskKey.RETURN: CoreReturn.SUCCESS}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __run_task(self, param, task_id):

        try:
            self.logger.info('run_task start, param: ' + str(param))
            resp = {}

            if param[CoreTaskKey.TASK] == CoreTaskKey.PREVIEW:

                self.logger.info('preview task start')

                image_src = param[CoreTaskKey.SOURCE]
                image_o = Image.open(image_src)
                w, h = image_o.size
                image = np.array(image_o.convert('RGBA'))

                with io.BytesIO() as output:
                    image_o.convert('RGB').save(output, format='JPEG', quality=100)
                    img_org_arr = output.getvalue()

                for config in param[CoreTaskKey.EFFECTS]:
                    mode = MangaPrettierCore.ModeDict[config[CoreTaskKey.TYPE]]
                    image = mode.run(image, config, param[CoreTaskKey.SHOW]).copy()

                image = Image.fromarray(image)
                with io.BytesIO() as output:
                    image.convert('RGB').save(output, format='JPEG', quality=100)
                    img_arr = output.getvalue()

                # print(base64.encodebytes(img_arr).decode('ascii'))
                resp = {
                    CoreTaskKey.RETURN: CoreReturn.SUCCESS,
                    CoreTaskKey.DATA: {
                        CoreTaskKey.IMAGE: base64.encodebytes(img_arr).decode('ascii'),
                        CoreTaskKey.IMAGE_ORG: base64.encodebytes(img_org_arr).decode('ascii'),
                        CoreTaskKey.IMAGE_INFO: {CoreTaskKey.WIDTH: w, CoreTaskKey.HEIGHT: h}
                    }
                }

                self.logger.info('preview task end')

            elif param[CoreTaskKey.TASK] == CoreTaskKey.BATCH:

                self.logger.info('batch task start')

                output_folder_name = datetime.now().strftime("%Y%m%d-%H%M%S")
                images_path = param[CoreTaskKey.PARAMETER][CoreTaskKey.IMAGES_PATH]
                effects = param[CoreTaskKey.PARAMETER][CoreTaskKey.EFFECTS]

                for image_i in range(len(images_path)):

                    self.thread_status_lock.acquire()
                    stop = task_id not in self.thread_status
                    self.thread_status_lock.release()

                    if stop:
                        self.logger.info('task_id ' + task_id + ' not exit, stop batch work')
                        return {}

                    # -- do batch work ---

                    image_src = images_path[image_i]
                    image_o = Image.open(image_src)
                    image = np.array(image_o.convert('RGBA'))

                    output_folder = os.path.join(os.path.dirname(image_src), output_folder_name)
                    if not os.path.exists(output_folder):
                        os.makedirs(output_folder)

                    output_path = os.path.join(output_folder, os.path.basename(image_src))

                    for config in effects:
                        mode = MangaPrettierCore.ModeDict[config[CoreTaskKey.TYPE]]
                        image = mode.run(image, config, False).copy()

                    image = Image.fromarray(image).convert('RGB')
                    #image.save(os.path.splitext(output_path)[0]+'.png', format='png')
                    image.save(os.path.splitext(output_path)[0] + '.jpg', format='jpeg', quality=95, optimize=True)

                    # --------------------

                    self.task_dict_lock.acquire()
                    self.task_dict[task_id] = {
                        CoreTaskKey.RETURN: CoreReturn.PROCESSING,
                        CoreTaskKey.DATA: {
                            CoreTaskKey.CURRENT: image_i,
                            CoreTaskKey.TOTAL: len(images_path)
                        }
                    }
                    self.task_dict_lock.release()

                resp = {
                    CoreTaskKey.RETURN: CoreReturn.SUCCESS,
                    CoreTaskKey.DATA: {
                        CoreTaskKey.CURRENT: len(images_path),
                        CoreTaskKey.TOTAL: len(images_path)
                    }
                }

                self.logger.info('batch task end')

            self.logger.info('run_task end')

            return resp

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __stop_task(self, param):

        try:
            self.logger.info('stop_task start')

            task_id = param[CoreTaskKey.TASK_ID]
            self.thread_status_lock.acquire()
            if task_id in self.thread_status:
                self.thread_status.pop(task_id, None)
            self.thread_status_lock.release()

            self.logger.info('stop_task end')

            return {CoreTaskKey.RETURN: CoreReturn.SUCCESS}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __run_task_async(self, param):

        try:
            self.logger.info('run_task_async start')

            task_id = str(uuid.uuid4())
            self.task_dict_lock.acquire()
            self.task_dict[task_id] = {
                CoreTaskKey.RETURN: CoreReturn.PROCESSING,
                CoreTaskKey.DATA: {}
            }
            self.task_dict_lock.release()

            self.thread_status_lock.acquire()
            self.thread_status[task_id] = True
            self.thread_status_lock.release()

            t_param = {CoreTaskKey.TASK_ID: task_id, CoreTaskKey.PARAMETER: param}
            t = threading.Thread(target=self.__run_task_thread, args=(t_param,))
            t.start()

            self.logger.info('run_task_async end')

            return {CoreTaskKey.RETURN: CoreReturn.SUCCESS, CoreTaskKey.TASK_ID: task_id}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __get_task_result(self, param):

        try:
            self.logger.info('get_task_result start')

            task_id = param[CoreTaskKey.TASK_ID]

            self.task_dict_lock.acquire()
            if task_id in self.task_dict:
                resp = {
                    CoreTaskKey.RETURN: self.task_dict[task_id][CoreTaskKey.RETURN],
                    CoreTaskKey.DATA: self.task_dict[task_id][CoreTaskKey.DATA]
                }

                if self.task_dict[task_id][CoreTaskKey.RETURN] == CoreReturn.SUCCESS:
                    self.task_dict.pop(task_id, None)
            else:
                resp = {
                    CoreTaskKey.RETURN: CoreReturn.TASK_NOT_FOUND,
                    CoreTaskKey.DATA: {
                        CoreTaskKey.IMAGE: ''
                    }
                }
            self.task_dict_lock.release()

            self.logger.info('get_task_result end')

            return resp

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    def __run_task_thread(self, t_param):

        resp = self.__run_task(t_param[CoreTaskKey.PARAMETER], t_param[CoreTaskKey.TASK_ID])
        if len(resp) > 0:
            self.task_dict_lock.acquire()
            self.task_dict[t_param[CoreTaskKey.TASK_ID]] = {
                CoreTaskKey.RETURN:
                    CoreReturn.SUCCESS if (resp is not None and resp[CoreTaskKey.RETURN] == 0) else
                    CoreReturn.EXCEPTION_ERROR,
                CoreTaskKey.DATA: resp[CoreTaskKey.DATA]
            }

            self.task_dict_lock.release()

    def run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            if param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.WARM_UP or \
                    param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.TEST_CONNECT:
                resp = self.__test_connect()

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.STOP_TASK:
                resp = self.__stop_task(param)

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.RUN_TASK_ASYNC:
                resp = self.__run_task_async(param)

            elif param[CoreTaskKey.COMMAND] == CoreTaskCmdKey.GET_TASK_RESULT:
                resp = self.__get_task_result(param)

            self.logger.info('run_task end')
            return resp

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return {CoreTaskKey.RETURN: CoreReturn.EXCEPTION_ERROR, CoreTaskKey.EXCEPTION: e}

    ModeDict = {
        CoreModeKey.BLEND: Blend,
        CoreModeKey.IMAGE_ENHANCE: ImageEnhance,
        CoreModeKey.LEVELS: Levels
    }


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("-port", dest="port")
    parser.add_argument("-log-path", dest="log_path")
    args = parser.parse_args()

    logger = logging.getLogger("MangaPrettierCore")
    formatter = logging.Formatter('%(asctime)s %(levelname)s : %(message)s - %(funcName)s (%(lineno)d)')
    file_handler = logging.FileHandler(os.path.join(args.log_path, 'core.log'))
    file_handler.setFormatter(formatter)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.formatter = formatter
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.setLevel(logging.DEBUG)

    logger.info('mpcore start')

    try:
        if args.port:
            s = zerorpc.Server(MangaPrettierCore(logger))
            s.bind("tcp://0.0.0.0:" + args.port)
            s.run()

        else:
            logger.error('Need assign port.')

    except Exception as exc:
        logger.error('exception = %s', exc, exc_info=True)
