import sys
import argparse
import logging
from PIL import Image
import numpy as np
import base64
import zerorpc
import io

from blackwhite import BlackWhite


class MangaPrettierCore(object):

    logger = None

    def __init__(self, mplogger):
        self.logger = mplogger

    def test_connect(self, param):

        try:
            self.logger.info('do testConnect')
            return {'ret': 0}

        except Exception as e:
            self.logger.error('exception = %s', e, exc_info=True)
            return None

    def run_task(self, param):

        try:
            self.logger.info('run_task start, param: ' + str(param))

            image_src = param['src']
            image = np.array(Image.open(image_src))

            h, w, layers = image.shape
            if layers == 3:
                image = np.dstack((image, np.zeros((h, w), dtype=np.uint8) + 255))

            #self.logger.debug(image)
            #self.logger.debug(image.shape)

            mode = MangaPrettierCore.ModeDict[param['type']]

            for config in param['effects']:
                image = mode.run(image, config, param['show'])

            image = Image.fromarray(image)
            with io.BytesIO() as output:
                image.save(output, format='png')
                img_arr = output.getvalue()

            self.logger.info('run_task end')
            #print(base64.encodebytes(img_arr).decode('ascii'))
            return {'ret': 0, 'img': base64.encodebytes(img_arr).decode('ascii')}

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
