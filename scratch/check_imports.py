try:
    import openpyxl
    import pptx
    print("SUCCESS: openpyxl and pptx are installed")
except ImportError as e:
    print(f"FAILURE: {e}")
