import sys
import argparse
import logging
from PIL import Image
import numpy as np
import base64
import zerorpc
import io
import threading

from blackwhite import BlackWhite


class MangaPrettierCore(object):

    logger = None
    task_dict = {}  # id:{'status': 0, 'img': 'data'}  status: 0: finished, 1: processing, -1: error or not found

    def __init__(self, mplogger):
        self.logger = mplogger

    def __test_connect(self):

        try:
            self.logger.info('do testConnect')
            return {'ret': 0}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return None

    def __run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            image_src = param['src']
            image = np.array(Image.open(image_src))

            h, w, layers = image.shape
            if layers == 3:
                image = np.dstack((image, np.zeros((h, w), dtype=np.uint8) + 255))

            # self.logger.debug(image)
            # self.logger.debug(image.shape)

            mode = MangaPrettierCore.ModeDict[param['type']]

            for config in param['effects']:
                image = mode.run(image, config, param['show'])

            image = Image.fromarray(image)
            with io.BytesIO() as output:
                image.save(output, format='png')
                img_arr = output.getvalue()

            self.logger.info('run_task end')
            # print(base64.encodebytes(img_arr).decode('ascii'))
            return {'ret': 0, 'img': base64.encodebytes(img_arr).decode('ascii')}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return None

    def __run_task_thread(self, t_param):

        resp = self.__run_task(t_param['param'])

        if resp is not None and resp['ret'] == 0:
            self.task_dict[t_param['task_id']] = {'status': 0, 'img': resp['img']}
        else:
            self.task_dict[t_param['task_id']] = {'status': -1, 'img': ''}

    def run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            if param['cmd'] == 'warm_up' or param['cmd'] == 'test_connect':
                resp = self.__test_connect()

            elif param['cmd'] == 'run_task':
                resp =  self.__run_task(param)

            elif param['cmd'] == 'run_task_async':
                self.task_dict['001'] = {'status': 1, 'img': ''}
                t_param = {'task_id': '001', 'param': param}
                t = threading.Thread(target=self.__run_task_thread, args=(t_param,))
                t.start()
                resp = {'ret': 0, 'task_id': '001'}

            elif param['cmd'] == 'get_task_result':
                task_id = param['task_id']
                if task_id in self.task_dict:
                    resp = {'ret': self.task_dict[task_id]['status'], 'img': self.task_dict[task_id]['img']}
                else:
                    resp = {'ret': -1, 'img': self.task_dict[task_id]['img']}

            self.logger.info('run_task end')
            return resp

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return None


    ModeDict = {
        'bw': BlackWhite
    }


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
