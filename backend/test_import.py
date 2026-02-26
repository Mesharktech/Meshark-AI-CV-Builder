import traceback
try:
    import main
    print('Success')
except Exception as e:
    print('Error caught:')
    traceback.print_exc()
