import logging
import sys

def setup_logger():
    # Create logger
    logger = logging.getLogger("meshark_api")
    logger.setLevel(logging.INFO)

    # Prevent formatting multiple times if initialized multiple times
    if not logger.handlers:
        # Create console handler and set level to debug
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(logging.INFO)

        # Create formatter
        formatter = logging.Formatter('%(asctime)s - [%(levelname)s] - %(name)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

        # Add formatter to ch
        ch.setFormatter(formatter)

        # Add ch to logger
        logger.addHandler(ch)

    return logger

logger = setup_logger()
