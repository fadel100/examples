import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { MedusaError, remoteQueryObjectFromString } from "@medusajs/utils";
import { createRestaurantWorkflow } from "../../workflows/restaurant/workflows/create-restaurant";
import { restaurantSchema } from "./validation-schemas";
import { CreateRestaurant } from "../../modules/restaurant/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = restaurantSchema.parse(req.body) as CreateRestaurant;

  if (!validatedBody) {
    return MedusaError.Types.INVALID_DATA;
  }

  const { result: restaurant } = await createRestaurantWorkflow(req.scope).run({
    input: {
      restaurant: validatedBody,
    },
  });

  return res.status(200).json({ restaurant });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { currency_code = "eur", ...queryFilters } = req.query;

  const remoteQuery = req.scope.resolve("remoteQuery");

  const restaurantsQuery = remoteQueryObjectFromString({
    entryPoint: "restaurants",
    fields: [
      "id",
      "handle",
      "name",
      "address",
      "phone",
      "email",
      "image_url",
      "is_open",
      "products.*",
      "products.categories.*",
      "products.variants.*",
      "products.variants.calculated_price.*"
    ],
    variables: {
      filters: queryFilters,
      "products.variants.calculated_price": {
        context: {
          currency_code
        }
      }
    },
  });

  const restaurants = await remoteQuery(restaurantsQuery);

  return res.status(200).json({ restaurants });
}
