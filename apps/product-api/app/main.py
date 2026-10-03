from fastapi import FastAPI


app = FastAPI()


@app.get("/products")
def list_products():
    return [
        {"id": 1, "name": "Notebook", "price": 1000},
        {"id": 2, "name": "Pen", "price": 200},
    ]
