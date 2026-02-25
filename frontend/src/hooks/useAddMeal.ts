export function useAddMeal() {
  const queryClient = useQueryClient();

  return useMutation<Meal, AddMealRequest>({
    mutationFn: (data) => mealService.addMeal(data),

    onMutate: async (newMeal) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.MEALS.BY_DATE(newMeal.date),
      });

      const previousMeals = queryClient.getQueryData<Meal[]>(
          QUERY_KEYS.MEALS.BY_DATE(newMeal.date)
      );

      if (previousMeals) {
        queryClient.setQueryData<Meal[]>(
            QUERY_KEYS.MEALS.BY_DATE(newMeal.date),
            [
              ...previousMeals,
              {
                id: `temp-${Date.now()}`,
                ...newMeal,
              } as Meal,
            ]
        );
      }

      return { previousMeals };
    },

    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(
            QUERY_KEYS.MEALS.BY_DATE(variables.date),
            context.previousMeals
        );
      }

      console.error(error.message);
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEALS.BY_DATE(variables.date),
      });
    },
  });
}